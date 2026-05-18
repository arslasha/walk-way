from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaceViewSet, CategoryViewSet, TagViewSet, RouteCalculateView

router = DefaultRouter()
router.register(r'places', PlaceViewSet, basename='place')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('routes/calculate/', RouteCalculateView.as_view(), name='route-calculate'),
    path('', include(router.urls)),
]
