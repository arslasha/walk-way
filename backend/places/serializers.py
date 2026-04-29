from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Category, Tag, Place

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'image_url', 'is_vibe']

class PlaceSerializer(GeoFeatureModelSerializer):
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Place
        geo_field = "location"
        fields = ['id', 'kudago_id', 'title', 'description', 'address', 'category', 'tags', 'photos', 'is_active']
