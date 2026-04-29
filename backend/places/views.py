from rest_framework import generics
from .models import Place, Category, Tag
from .serializers import PlaceSerializer, CategorySerializer, TagSerializer
from .filters import PlaceFilter

class PlaceListView(generics.ListAPIView):
    queryset = Place.objects.filter(is_active=True).prefetch_related('tags').select_related('category')
    serializer_class = PlaceSerializer
    filterset_class = PlaceFilter

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None

class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None
