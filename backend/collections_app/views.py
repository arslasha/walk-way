from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from places.models import Place
from users.models import Friendship
from .models import Collection
from .serializers import CollectionSerializer, CollectionDetailSerializer


class IsOwner(permissions.BasePermission):
    """Object-level permission: only the collection owner can modify it or safe read if friends and public."""
    def has_object_permission(self, request, view, obj):
        if obj.owner == request.user:
            return True
        if request.method in permissions.SAFE_METHODS and obj.is_public:
            # Check if there is an accepted friendship between request.user and obj.owner
            return Friendship.objects.filter(
                (Q(user_from=request.user, user_to=obj.owner) |
                 Q(user_from=obj.owner, user_to=request.user)),
                status='ACCEPTED'
            ).exists()
        return False


class CollectionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/collections/   → list current user's collections (with places)
    POST /api/v1/collections/   → create a new collection
    """
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


class CollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/collections/{id}/   → detail with places list
    PATCH  /api/v1/collections/{id}/   → update (owner only)
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
            return Response({"error": "place_id обязателен"}, status=status.HTTP_400_BAD_REQUEST)

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
            return Response({"error": "place_id обязателен"}, status=status.HTTP_400_BAD_REQUEST)

        place = get_object_or_404(Place, pk=place_id)
        collection.places.remove(place)
        return Response({"detail": "Место удалено из коллекции"}, status=status.HTTP_200_OK)
