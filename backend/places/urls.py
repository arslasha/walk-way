from django.urls import path
from .views import PlaceListView, CategoryListView, TagListView

urlpatterns = [
    path('', PlaceListView.as_view(), name='place-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('tags/', TagListView.as_view(), name='tag-list'),
]
