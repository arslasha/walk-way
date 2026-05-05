from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Category, Tag, Place

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image_url']

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
        fields = [
            'id', 'title', 'description', 'address', 'category', 'tags',
            'is_active', 'is_analyzed', 'photos', 'icebreakers'
        ]
