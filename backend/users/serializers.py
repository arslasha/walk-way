import os
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from .models import UserProfile

class UserRegisterSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(max_length=50, required=True)
    bio = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('email', 'password', 'nickname', 'bio')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("Этот email уже зарегистрирован")
        return value

    def validate_nickname(self, value):
        if UserProfile.objects.filter(nickname=value).exists():
            raise ValidationError("Этот никнейм уже занят")
        return value

    def validate(self, attrs):
        validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        nickname = validated_data['nickname']
        bio = validated_data.get('bio', '')

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password
        )

        UserProfile.objects.create(
            user=user,
            nickname=nickname,
            bio=bio
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True, error_messages={
        'invalid_image': 'Невалидный или поврежденный файл изображения',
    })

    class Meta:
        model = UserProfile
        fields = ('email', 'username', 'nickname', 'bio', 'avatar', 'is_2fa_enabled')
        read_only_fields = ('is_2fa_enabled',)

    def validate_nickname(self, value):
        user = self.context['request'].user
        if UserProfile.objects.filter(nickname=value).exclude(user=user).exists():
            raise ValidationError("Этот никнейм уже занят")
        return value

    def validate_avatar(self, value):
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise ValidationError("Файл слишком большой. Максимальный размер — 5 МБ")
            
            # Check file extension / format
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
                raise ValidationError("Разрешены только форматы JPEG, PNG, WebP")
            
            try:
                img = Image.open(value)
                img.verify()
            except Exception:
                raise ValidationError("Невалидный или поврежденный файл изображения")
        return value

    def update(self, instance, validated_data):
        avatar = validated_data.pop('avatar', None)
        
        # Standard updates
        instance.nickname = validated_data.get('nickname', instance.nickname)
        instance.bio = validated_data.get('bio', instance.bio)

        if avatar:
            # Re-open image for manipulation since verify() closed/invalidated it
            img = Image.open(avatar)
            
            # Auto compress/resize to 400x400 px maintaining ratio
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            
            # If WebP is possible, save as WebP, otherwise keep JPEG
            output = BytesIO()
            img.save(output, format='JPEG', quality=85)
            output.seek(0)
            
            # Save processed image back
            avatar_name = os.path.splitext(avatar.name)[0] + '.jpg'
            instance.avatar.save(avatar_name, ContentFile(output.read()), save=False)

        instance.save()
        return instance
