import pyotp
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.core import signing
from django.utils.decorators import method_decorator
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import ValidationError

from django.db import models
from .models import UserProfile, Friendship
from .serializers import (
    UserRegisterSerializer,
    UserProfileSerializer,
    UserProfilePublicSerializer,
    FriendshipListSerializer,
    FriendshipRequestSerializer,
)



def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile = user.profile
        
        # Auto login on registration
        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'email': user.email,
                'nickname': profile.nickname,
                'bio': profile.bio,
                'is_2fa_enabled': profile.is_2fa_enabled,
                'is_staff': user.is_staff
            },
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"error": "Пожалуйста, введите email и пароль"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate using email as username
        user = authenticate(username=email, password=password)
        if user is None:
            return Response(
                {"error": "Неверный email или пароль"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        profile = user.profile
        if profile.is_2fa_enabled:
            # Generate pre-auth token
            pre_auth_token = signing.dumps({'user_id': user.id}, salt='2fa-pre-auth')
            return Response({
                '2fa_required': True,
                'pre_auth_token': pre_auth_token
            }, status=status.HTTP_200_OK)

        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'email': user.email,
                'nickname': profile.nickname,
                'bio': profile.bio,
                'avatar': profile.avatar.url if profile.avatar else None,
                'is_2fa_enabled': profile.is_2fa_enabled,
                'is_staff': user.is_staff
            },
            'tokens': tokens
        }, status=status.HTTP_200_OK)


class TwoFactorVerifyView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):
        pre_auth_token = request.data.get('pre_auth_token')
        code = request.data.get('code')

        if not pre_auth_token or not code:
            return Response(
                {"error": "Отсутствует pre_auth_token или код подтверждения"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payload = signing.loads(pre_auth_token, salt='2fa-pre-auth', max_age=300)
            user_id = payload.get('user_id')
            user = User.objects.get(id=int(user_id))
        except (signing.SignatureExpired, signing.BadSignature, User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "Срок действия сессии истек или токен недействителен. Пожалуйста, войдите заново."},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile = user.profile
        
        # 1. Check backup codes
        backup_match = False
        if profile.backup_codes:
            for idx, stored_hash in enumerate(profile.backup_codes):
                if check_password(code, stored_hash):
                    # Remove used backup code
                    profile.backup_codes.pop(idx)
                    profile.save()
                    backup_match = True
                    break
        
        # 2. Check TOTP code if not backup match
        if not backup_match:
            totp = pyotp.TOTP(profile.otp_secret)
            if not totp.verify(code, valid_window=2):
                return Response(
                    {"error": "Неверный код двухфакторной аутентификации"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        tokens = get_tokens_for_user(user)
        return Response({
            'user': {
                'email': user.email,
                'nickname': profile.nickname,
                'bio': profile.bio,
                'avatar': profile.avatar.url if profile.avatar else None,
                'is_2fa_enabled': profile.is_2fa_enabled,
                'is_staff': user.is_staff
            },
            'tokens': tokens
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user.profile


class TwoFactorEnableView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        profile = request.user.profile
        
        # Generate new TOTP secret (do not mark as enabled yet)
        otp_secret = pyotp.random_base32()
        profile.otp_secret = otp_secret
        
        # Generate backup codes (5 codes of 8 hex digits)
        import secrets
        plain_backup_codes = [secrets.token_hex(4) for _ in range(5)]
        
        # Store as secure hashes in the database
        profile.backup_codes = [make_password(code) for code in plain_backup_codes]
        profile.save()

        # Provisioning URI for QR code
        totp = pyotp.TOTP(otp_secret)
        otp_uri = totp.provisioning_uri(name=request.user.email, issuer_name="Walk-Way")

        return Response({
            'otp_secret': otp_secret,
            'otp_uri': otp_uri,
            'backup_codes': plain_backup_codes
        }, status=status.HTTP_200_OK)


class TwoFactorConfirmView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response(
                {"error": "Необходимо указать код подтверждения TOTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile = request.user.profile
        if not profile.otp_secret:
            return Response(
                {"error": "2FA не настроена. Пожалуйста, запросите QR-код сначала."},
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(profile.otp_secret)
        if not totp.verify(code, valid_window=2):
            return Response(
                {"error": "Неверный код TOTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.is_2fa_enabled = True
        profile.save()
        return Response({
            "status": "enabled",
            "message": "Двухфакторная аутентификация успешно включена"
        }, status=status.HTTP_200_OK)


class TwoFactorDisableView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        password = request.data.get('password')
        code = request.data.get('code')

        if not password or not code:
            return Response(
                {"error": "Необходимо ввести пароль и код TOTP (или резервный код)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        if not user.check_password(password):
            return Response(
                {"error": "Неверный пароль"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile = user.profile
        
        # Check code
        code_valid = False
        # 1. Check backup code
        if profile.backup_codes:
            for idx, stored_hash in enumerate(profile.backup_codes):
                if check_password(code, stored_hash):
                    code_valid = True
                    break
        
        # 2. Check TOTP
        if not code_valid and profile.otp_secret:
            totp = pyotp.TOTP(profile.otp_secret)
            if totp.verify(code, valid_window=2):
                code_valid = True

        if not code_valid:
            return Response(
                {"error": "Неверный код TOTP или резервный код"},
                status=status.HTTP_400_BAD_REQUEST
            )

        profile.is_2fa_enabled = False
        profile.otp_secret = None
        profile.backup_codes = []
        profile.save()

        return Response({
            "status": "disabled",
            "message": "Двухфакторная аутентификация отключена"
        }, status=status.HTTP_200_OK)


class FriendRequestView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        to_user_id = request.data.get('to_user_id')
        if not to_user_id:
            return Response({"error": "Укажите to_user_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            to_user_id = int(to_user_id)
        except (ValueError, TypeError):
            return Response({"error": "Неверный формат to_user_id"}, status=status.HTTP_400_BAD_REQUEST)

        if to_user_id == request.user.id:
            return Response({"error": "Вы не можете отправить запрос в друзья самому себе"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)

        existing = Friendship.objects.filter(
            (models.Q(user_from=request.user, user_to=to_user) |
             models.Q(user_from=to_user, user_to=request.user))
        ).first()

        if existing:
            if existing.status == 'ACCEPTED':
                return Response({"error": "Вы уже друзья"}, status=status.HTTP_400_BAD_REQUEST)
            elif existing.status == 'BLOCKED':
                return Response({"error": "Пользователь заблокирован"}, status=status.HTTP_400_BAD_REQUEST)
            elif existing.status == 'PENDING':
                if existing.user_from == request.user:
                    return Response({"error": "Запрос уже отправлен"}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    existing.status = 'ACCEPTED'
                    existing.save()
                    return Response({
                        "message": "Взаимный запрос обнаружен. Дружба успешно подтверждена!",
                        "status": "ACCEPTED",
                        "friendship_id": existing.id
                    }, status=status.HTTP_200_OK)

        friendship = Friendship.objects.create(
            user_from=request.user,
            user_to=to_user,
            status='PENDING'
        )
        return Response({
            "message": "Запрос в друзья успешно отправлен",
            "status": "PENDING",
            "friendship_id": friendship.id
        }, status=status.HTTP_201_CREATED)


class FriendRespondView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        friendship_id = request.data.get('friendship_id')
        action = request.data.get('action')

        if not friendship_id or action not in ['accept', 'decline']:
            return Response({"error": "Необходимы параметры friendship_id и action ('accept'/'decline')"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friendship = Friendship.objects.get(id=friendship_id)
        except Friendship.DoesNotExist:
            return Response({"error": "Запрос не найден"}, status=status.HTTP_404_NOT_FOUND)

        if friendship.status != 'PENDING':
            return Response({"error": "Этот запрос уже обработан или неактивен"}, status=status.HTTP_400_BAD_REQUEST)

        if friendship.user_to != request.user:
            return Response({"error": "Вы не являетесь получателем этого запроса"}, status=status.HTTP_403_FORBIDDEN)

        if action == 'accept':
            friendship.status = 'ACCEPTED'
            friendship.save()
            return Response({"message": "Запрос в друзья принят", "status": "ACCEPTED"}, status=status.HTTP_200_OK)
        else:
            friendship.delete()
            return Response({"message": "Запрос в друзья отклонен", "status": "DECLINED"}, status=status.HTTP_200_OK)


class FriendBlockView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        to_user_id = request.data.get('to_user_id')
        if not to_user_id:
            return Response({"error": "Укажите to_user_id для блокировки"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user_id = int(to_user_id)
        except (ValueError, TypeError):
            return Response({"error": "Неверный формат to_user_id"}, status=status.HTTP_400_BAD_REQUEST)

        if to_user_id == request.user.id:
            return Response({"error": "Вы не можете заблокировать самого себя"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=status.HTTP_404_NOT_FOUND)

        friendship = Friendship.objects.filter(
            (models.Q(user_from=request.user, user_to=to_user) |
             models.Q(user_from=to_user, user_to=request.user))
        ).first()

        if friendship:
            friendship.user_from = request.user
            friendship.user_to = to_user
            friendship.status = 'BLOCKED'
            friendship.save()
        else:
            friendship = Friendship.objects.create(
                user_from=request.user,
                user_to=to_user,
                status='BLOCKED'
            )

        return Response({"message": "Пользователь успешно заблокирован", "status": "BLOCKED"}, status=status.HTTP_200_OK)


class FriendsListView(generics.ListAPIView):
    serializer_class = FriendshipListSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return Friendship.objects.filter(
            (models.Q(user_from=self.request.user) | models.Q(user_to=self.request.user)),
            status='ACCEPTED'
        ).select_related('user_from', 'user_to', 'user_from__profile', 'user_to__profile')


class FriendRequestsView(generics.ListAPIView):
    serializer_class = FriendshipRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        return Friendship.objects.filter(
            (models.Q(user_from=self.request.user) | models.Q(user_to=self.request.user)),
            status='PENDING'
        ).select_related('user_from', 'user_to', 'user_from__profile', 'user_to__profile')


class FriendshipDeleteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, pk, *args, **kwargs):
        try:
            friendship = Friendship.objects.get(id=pk)
        except Friendship.DoesNotExist:
            return Response({"error": "Связь не найдена"}, status=status.HTTP_404_NOT_FOUND)

        if friendship.user_from != request.user and friendship.user_to != request.user:
            return Response({"error": "Вы не являетесь участником этой связи"}, status=status.HTTP_403_FORBIDDEN)

        if friendship.status == 'BLOCKED' and friendship.user_from != request.user:
            return Response({"error": "Вы не можете разблокировать этого пользователя"}, status=status.HTTP_403_FORBIDDEN)

        friendship.delete()
        return Response({"message": "Успешно удалено", "status": "DELETED"}, status=status.HTTP_200_OK)




class PublicProfileDetailView(generics.RetrieveAPIView):
    serializer_class = UserProfilePublicSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'nickname'

    def get_queryset(self):
        blocked_user_ids = Friendship.objects.filter(
            (models.Q(user_from=self.request.user) | models.Q(user_to=self.request.user)) &
            models.Q(status='BLOCKED')
        ).values_list('user_from_id', 'user_to_id')

        blocked_ids = set()
        for f_id, t_id in blocked_user_ids:
            blocked_ids.add(f_id)
            blocked_ids.add(t_id)
        blocked_ids.discard(self.request.user.id)

        return UserProfile.objects.exclude(user_id__in=blocked_ids)


class PublicProfileSearchView(generics.ListAPIView):
    serializer_class = UserProfilePublicSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = None

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return UserProfile.objects.none()

        blocked_user_ids = Friendship.objects.filter(
            (models.Q(user_from=self.request.user) | models.Q(user_to=self.request.user)) &
            models.Q(status='BLOCKED')
        ).values_list('user_from_id', 'user_to_id')

        blocked_ids = set()
        for f_id, t_id in blocked_user_ids:
            blocked_ids.add(f_id)
            blocked_ids.add(t_id)
        blocked_ids.discard(self.request.user.id)

        return UserProfile.objects.exclude(
            user_id__in=blocked_ids
        ).exclude(
            user=self.request.user
        ).filter(
            nickname__icontains=query
        ).select_related('user', 'user__profile')


