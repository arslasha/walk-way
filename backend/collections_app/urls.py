from django.urls import path
from .views import (
    CollectionListCreateView,
    CollectionDetailView,
    CollectionAddPlaceView,
    CollectionRemovePlaceView,
)

urlpatterns = [
    path("collections/", CollectionListCreateView.as_view(), name="collection-list"),
    path("collections/<int:pk>/", CollectionDetailView.as_view(), name="collection-detail"),
    path("collections/<int:pk>/add-place/", CollectionAddPlaceView.as_view(), name="collection-add-place"),
    path("collections/<int:pk>/remove-place/", CollectionRemovePlaceView.as_view(), name="collection-remove-place"),
]
