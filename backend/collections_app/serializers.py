from rest_framework import serializers
from places.models import Place
from .models import Collection


class PlaceMinimalSerializer(serializers.ModelSerializer):
    """Lightweight serializer for places nested inside a collection."""
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = Place
        fields = ["id", "title", "address", "lat", "lng"]

    def get_lat(self, obj):
        if obj.location:
            return obj.location.y
        return None

    def get_lng(self, obj):
        if obj.location:
            return obj.location.x
        return None


class CollectionSerializer(serializers.ModelSerializer):
    places_count = serializers.SerializerMethodField()
    owner_nickname = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            "id",
            "name",
            "description",
            "is_public",
            "places_count",
            "owner_nickname",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "places_count", "owner_nickname"]

    def get_places_count(self, obj):
        return obj.places.count()

    def get_owner_nickname(self, obj):
        try:
            return obj.owner.profile.nickname
        except Exception:
            return obj.owner.username


class CollectionDetailSerializer(CollectionSerializer):
    """Extended serializer that includes the list of places."""
    places = PlaceMinimalSerializer(many=True, read_only=True)

    class Meta(CollectionSerializer.Meta):
        fields = CollectionSerializer.Meta.fields + ["places"]

