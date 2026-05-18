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

from .models import UserProfile
from .serializers import UserRegisterSerializer, UserProfileSerializer



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
                'is_2fa_enabled': profile.is_2fa_enabled
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
                'is_2fa_enabled': profile.is_2fa_enabled
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
            if not totp.verify(code):
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
                'is_2fa_enabled': profile.is_2fa_enabled
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
        if not totp.verify(code):
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
            if totp.verify(code):
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
