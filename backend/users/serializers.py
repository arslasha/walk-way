import os
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.db import models
from .models import UserProfile, Friendship

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


class UserProfilePublicSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    friendship_status = serializers.SerializerMethodField()
    friendship_id = serializers.SerializerMethodField()
    collections = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ('nickname', 'bio', 'avatar', 'friendship_status', 'friendship_id', 'collections')

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_friendship_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            return None
        
        friendship = Friendship.objects.filter(
            (models.Q(user_from=request.user, user_to=obj.user) |
             models.Q(user_from=obj.user, user_to=request.user))
        ).first()

        if not friendship:
            return None
        
        if friendship.status == 'ACCEPTED':
            return 'accepted'
        elif friendship.status == 'BLOCKED':
            return 'blocked'
        elif friendship.status == 'PENDING':
            if friendship.user_from == request.user:
                return 'pending_sent'
            else:
                return 'pending_received'
        return None

    def get_friendship_id(self, obj):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            return None
        
        friendship = Friendship.objects.filter(
            (models.Q(user_from=request.user, user_to=obj.user) |
             models.Q(user_from=obj.user, user_to=request.user))
        ).first()
        return friendship.id if friendship else None

    def get_collections(self, obj):
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            return []
        
        is_friend = Friendship.objects.filter(
            (models.Q(user_from=request.user, user_to=obj.user) |
             models.Q(user_from=obj.user, user_to=request.user)),
            status='ACCEPTED'
        ).exists()

        if is_friend:
            from collections_app.models import Collection
            from collections_app.serializers import CollectionDetailSerializer
            public_cols = Collection.objects.filter(owner=obj.user, is_public=True)
            return CollectionDetailSerializer(public_cols, many=True, context=self.context).data
        return []


class FriendSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source='profile.nickname')
    bio = serializers.CharField(source='profile.bio', required=False, allow_blank=True, default='')
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'nickname', 'bio', 'avatar')

    def get_avatar(self, obj):
        try:
            if obj.profile.avatar:
                return obj.profile.avatar.url
        except Exception:
            pass
        return None


class FriendshipListSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ('id', 'status', 'created_at', 'friend')

    def get_friend(self, obj):
        request = self.context.get('request')
        current_user = request.user if request else None
        friend_user = obj.user_to if obj.user_from == current_user else obj.user_from
        return FriendSerializer(friend_user, context=self.context).data


class FriendshipRequestSerializer(serializers.ModelSerializer):
    direction = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ('id', 'status', 'created_at', 'direction', 'user')

    def get_direction(self, obj):
        request = self.context.get('request')
        current_user = request.user if request else None
        if obj.user_from == current_user:
            return 'outgoing'
        return 'incoming'

    def get_user(self, obj):
        request = self.context.get('request')
        current_user = request.user if request else None
        other_user = obj.user_to if obj.user_from == current_user else obj.user_from
        return FriendSerializer(other_user, context=self.context).data

