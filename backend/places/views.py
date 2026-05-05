from rest_framework import viewsets
from rest_framework_gis.filters import InBBoxFilter
from django_filters import rest_framework as filters
from .models import Category, Tag, Place
from .serializers import CategorySerializer, TagSerializer, PlaceSerializer
from .filters import PlaceFilter

class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Place.objects.filter(is_active=True).select_related('category').prefetch_related('tags')
    serializer_class = PlaceSerializer
    filter_backends = (filters.DjangoFilterBackend, InBBoxFilter)
    filterset_class = PlaceFilter
    bbox_filter_field = 'location'

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['is_vibe']
