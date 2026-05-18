from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from places.models import Place
from .models import Collection
from .serializers import CollectionSerializer, CollectionDetailSerializer


class IsOwner(permissions.BasePermission):
    """Object-level permission: only the collection owner can modify it."""
    def has_object_permission(self, request, view, obj):
        # Read permissions for public collections (if method is safe)
        if request.method in permissions.SAFE_METHODS and obj.is_public:
            return True
        return obj.owner == request.user


class CollectionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/collections/   → list current user's collections (with places)
    POST /api/v1/collections/   → create a new collection
    """
    # Use detail serializer for GET (includes places) but basic for POST
    permission_classes = [permissions.IsAuthenticated]
    # Disable global GeoJsonPagination — this is not a GeoJSON endpoint
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CollectionDetailSerializer
        return CollectionSerializer

    def get_queryset(self):
        return Collection.objects.filter(owner=self.request.user).prefetch_related("places")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class CollectionDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/v1/collections/{id}/   → detail with places list
    DELETE /api/v1/collections/{id}/   → delete (owner only)
    """
    queryset = Collection.objects.prefetch_related("places").all()
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CollectionDetailSerializer
        return CollectionSerializer


class CollectionAddPlaceView(APIView):
    """
    POST /api/v1/collections/{id}/add-place/
    Body: { "place_id": <int> }
    Idempotent — .add() doesn't create duplicates.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        collection = get_object_or_404(Collection, pk=pk, owner=request.user)
        place_id = request.data.get("place_id")
        if not place_id:
            return Response({"error": "пласс place_id обязателен"}, status=status.HTTP_400_BAD_REQUEST)

        place = get_object_or_404(Place, pk=place_id)
        collection.places.add(place)
        return Response({"detail": "Место добавлено в коллекцию"}, status=status.HTTP_200_OK)


class CollectionRemovePlaceView(APIView):
    """
    POST /api/v1/collections/{id}/remove-place/
    Body: { "place_id": <int> }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        collection = get_object_or_404(Collection, pk=pk, owner=request.user)
        place_id = request.data.get("place_id")
        if not place_id:
            return Response({"error": "пласс place_id обязателен"}, status=status.HTTP_400_BAD_REQUEST)

        place = get_object_or_404(Place, pk=place_id)
        collection.places.remove(place)
        return Response({"detail": "Место удалено из коллекции"}, status=status.HTTP_200_OK)
