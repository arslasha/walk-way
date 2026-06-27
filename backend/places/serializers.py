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

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False
    )
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source='tags', write_only=True, many=True, required=False
    )

    class Meta:
        model = Place
        geo_field = "location"
        fields = [
            'id', 'title', 'description', 'address', 'category', 'tags',
            'category_id', 'tag_ids',
            'is_active', 'is_analyzed', 'photos', 'icebreakers',
            'opening_hours', 'opening_hours_text', 'price_level', 'is_indoor'
        ]
