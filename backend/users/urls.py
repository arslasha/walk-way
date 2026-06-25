from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    UserRegisterView,
    UserLoginView,
    TwoFactorVerifyView,
    UserProfileView,
    TwoFactorEnableView,
    TwoFactorConfirmView,
    TwoFactorDisableView,
    FriendRequestView,
    FriendRespondView,
    FriendBlockView,
    FriendsListView,
    FriendRequestsView,
    FriendshipDeleteView,
    PublicProfileDetailView,
    PublicProfileSearchView,
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', UserRegisterView.as_view(), name='auth-register'),
    path('auth/login/', UserLoginView.as_view(), name='auth-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('auth/2fa/verify/', TwoFactorVerifyView.as_view(), name='auth-2fa-verify'),

    # Profile Endpoints
    path('profiles/me/', UserProfileView.as_view(), name='profile-me'),
    path('profiles/me/2fa/enable/', TwoFactorEnableView.as_view(), name='profile-2fa-enable'),
    path('profiles/me/2fa/confirm/', TwoFactorConfirmView.as_view(), name='profile-2fa-confirm'),
    path('profiles/me/2fa/disable/', TwoFactorDisableView.as_view(), name='profile-2fa-disable'),

    # Friend & Social Endpoints
    path('friends/', FriendsListView.as_view(), name='friends-list'),
    path('friends/requests/', FriendRequestsView.as_view(), name='friends-requests'),
    path('friends/request/', FriendRequestView.as_view(), name='friends-request-send'),
    path('friends/respond/', FriendRespondView.as_view(), name='friends-request-respond'),
    path('friends/block/', FriendBlockView.as_view(), name='friends-block'),
    path('friends/<int:pk>/', FriendshipDeleteView.as_view(), name='friends-delete'),

    # Public profiles
    path('profiles/search/', PublicProfileSearchView.as_view(), name='profiles-search'),
    path('profiles/<str:nickname>/', PublicProfileDetailView.as_view(), name='profile-detail'),
]

