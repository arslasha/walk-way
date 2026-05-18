import io
import pyotp
from PIL import Image
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.core import signing
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile
from .views import get_tokens_for_user

def generate_test_image(size=(800, 800), format_type='JPEG'):
    file_bytes = io.BytesIO()
    image = Image.new('RGB', size, 'white')
    image.save(file_bytes, format=format_type)
    file_bytes.seek(0)
    return SimpleUploadedFile(f"test.{format_type.lower()}", file_bytes.read(), content_type=f"image/{format_type.lower()}")


class AuthAndProfileTests(APITestCase):

    def setUp(self):
        self.register_url = '/api/v1/auth/register/'
        self.login_url = '/api/v1/auth/login/'
        self.verify_2fa_url = '/api/v1/auth/2fa/verify/'
        self.logout_url = '/api/v1/auth/logout/'
        self.profile_me_url = '/api/v1/profiles/me/'
        self.enable_2fa_url = '/api/v1/profiles/me/2fa/enable/'
        self.confirm_2fa_url = '/api/v1/profiles/me/2fa/confirm/'
        self.disable_2fa_url = '/api/v1/profiles/me/2fa/disable/'

        self.user_email = 'alice@example.com'
        self.user_password = 'securepassword123'
        self.user_nickname = 'AliceDesigner'

    def test_registration_success(self):
        data = {
            'email': self.user_email,
            'password': self.user_password,
            'nickname': self.user_nickname
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], self.user_email)
        
        # Verify DB entries
        user = User.objects.get(email=self.user_email)
        self.assertEqual(user.profile.nickname, self.user_nickname)

    def test_registration_duplicate_nickname(self):
        # Create pre-existing user
        existing_user = User.objects.create_user(username='other@example.com', email='other@example.com', password=self.user_password)
        UserProfile.objects.create(user=existing_user, nickname=self.user_nickname)

        data = {
            'email': self.user_email,
            'password': self.user_password,
            'nickname': self.user_nickname
        }
        response = self.client.post(self.register_url, data)
        print("DEBUG DUPLICATE NICKNAME RESPONSE STATUS:", response.status_code)
        print("DEBUG DUPLICATE NICKNAME RESPONSE DATA:", response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('detail'), "Этот никнейм уже занят")

    def test_registration_duplicate_email(self):
        User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)

        data = {
            'email': self.user_email,
            'password': self.user_password,
            'nickname': self.user_nickname
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('detail'), "Этот email уже зарегистрирован")

    def test_login_success_no_2fa(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        UserProfile.objects.create(user=user, nickname=self.user_nickname)

        data = {
            'email': self.user_email,
            'password': self.user_password
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertNotIn('2fa_required', response.data)

    def test_login_2fa_required(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        UserProfile.objects.create(
            user=user,
            nickname=self.user_nickname,
            is_2fa_enabled=True,
            otp_secret=pyotp.random_base32()
        )

        data = {
            'email': self.user_email,
            'password': self.user_password
        }
        response = self.client.post(self.login_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('2fa_required'))
        self.assertIn('pre_auth_token', response.data)
        self.assertNotIn('tokens', response.data)

    def test_verify_2fa_totp_success(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        otp_secret = pyotp.random_base32()
        UserProfile.objects.create(
            user=user,
            nickname=self.user_nickname,
            is_2fa_enabled=True,
            otp_secret=otp_secret
        )

        pre_auth_token = signing.dumps({'user_id': user.id}, salt='2fa-pre-auth')
        totp = pyotp.TOTP(otp_secret)
        code = totp.now()

        data = {
            'pre_auth_token': pre_auth_token,
            'code': code
        }
        response = self.client.post(self.verify_2fa_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], self.user_email)

    def test_verify_2fa_backup_code_success(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        backup_code = "XYZ12345"
        UserProfile.objects.create(
            user=user,
            nickname=self.user_nickname,
            is_2fa_enabled=True,
            otp_secret=pyotp.random_base32(),
            backup_codes=[make_password(backup_code)]
        )

        pre_auth_token = signing.dumps({'user_id': user.id}, salt='2fa-pre-auth')

        # Try verifying with incorrect code first
        response = self.client.post(self.verify_2fa_url, {
            'pre_auth_token': pre_auth_token,
            'code': 'WRONGONE'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Verify with correct backup code
        response = self.client.post(self.verify_2fa_url, {
            'pre_auth_token': pre_auth_token,
            'code': backup_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)

        # Check backup code was deleted/consumed
        user.profile.refresh_from_db()
        self.assertEqual(len(user.profile.backup_codes), 0)

    def test_logout_and_refresh_blacklist(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        UserProfile.objects.create(user=user, nickname=self.user_nickname)

        login_res = self.client.post(self.login_url, {'email': self.user_email, 'password': self.user_password})
        refresh_token = login_res.data['tokens']['refresh']

        # Logout (blacklist token)
        logout_res = self.client.post(self.logout_url, {'refresh': refresh_token})
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Attempt to refresh using blacklisted token
        refresh_api_url = '/api/v1/auth/refresh/'
        refresh_res = self.client.post(refresh_api_url, {'refresh': refresh_token})
        self.assertEqual(refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_me_get_and_patch(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        profile = UserProfile.objects.create(user=user, nickname=self.user_nickname, bio="Original bio")

        # Authenticate
        tokens = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])

        # GET profile
        response = self.client.get(self.profile_me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nickname'], self.user_nickname)
        self.assertEqual(response.data['bio'], "Original bio")

        # PATCH profile
        patch_data = {
            'nickname': 'NewNickname',
            'bio': 'Updated bio'
        }
        response = self.client.patch(self.profile_me_url, patch_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nickname'], 'NewNickname')
        self.assertEqual(response.data['bio'], 'Updated bio')

    def test_avatar_compression_and_validation(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        profile = UserProfile.objects.create(user=user, nickname=self.user_nickname)

        tokens = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])

        # 1. Test image resizing/compression (800x800 should become 400x400)
        large_image = generate_test_image(size=(800, 600), format_type='JPEG')
        response = self.client.patch(self.profile_me_url, {'avatar': large_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        profile.refresh_from_db()
        self.assertTrue(profile.avatar)

        # Inspect saved image dimensions
        img = Image.open(profile.avatar.path)
        self.assertTrue(img.width <= 400 and img.height <= 400)
        # Verify aspect ratio was preserved (800:600 -> 4:3 -> 400:300)
        self.assertEqual(img.width, 400)
        self.assertEqual(img.height, 300)

        # 2. Test broken image file error handling
        bad_image = SimpleUploadedFile("fake.png", b"not-a-real-image-file-data", content_type="image/png")
        response = self.client.patch(self.profile_me_url, {'avatar': bad_image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('detail'), "Невалидный или поврежденный файл изображения")

    def test_2fa_enable_confirm_disable_flow(self):
        user = User.objects.create_user(username=self.user_email, email=self.user_email, password=self.user_password)
        profile = UserProfile.objects.create(user=user, nickname=self.user_nickname)

        tokens = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])

        # 1. Enable 2FA (generates secret and backup codes)
        response = self.client.post(self.enable_2fa_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp_secret', response.data)
        self.assertIn('otp_uri', response.data)
        self.assertEqual(len(response.data['backup_codes']), 5)

        otp_secret = response.data['otp_secret']
        profile.refresh_from_db()
        self.assertFalse(profile.is_2fa_enabled) # Still False until confirmed!
        self.assertEqual(len(profile.backup_codes), 5)

        # 2. Confirm 2FA with wrong code
        response = self.client.post(self.confirm_2fa_url, {'code': '000000'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Confirm with correct code
        totp = pyotp.TOTP(otp_secret)
        response = self.client.post(self.confirm_2fa_url, {'code': totp.now()})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        profile.refresh_from_db()
        self.assertTrue(profile.is_2fa_enabled)

        # 3. Disable 2FA with wrong password
        response = self.client.post(self.disable_2fa_url, {'password': 'wrongpassword', 'code': totp.now()})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Disable 2FA successfully
        response = self.client.post(self.disable_2fa_url, {'password': self.user_password, 'code': totp.now()})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        profile.refresh_from_db()
        self.assertFalse(profile.is_2fa_enabled)
        self.assertIsNone(profile.otp_secret)
        self.assertEqual(len(profile.backup_codes), 0)
