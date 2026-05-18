from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.gis.geos import LineString
from django.contrib.gis.measure import D
from rest_framework_gis.filters import InBBoxFilter
from django_filters import rest_framework as filters
from .models import Category, Tag, Place
from .serializers import CategorySerializer, TagSerializer, PlaceSerializer
from .filters import PlaceFilter
from .services import ORSClient

class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Place.objects.filter(is_active=True).select_related('category').prefetch_related('tags').order_by('id')
    serializer_class = PlaceSerializer
    filter_backends = (filters.DjangoFilterBackend, InBBoxFilter)
    filterset_class = PlaceFilter
    bbox_filter_field = 'location'

    @action(detail=False, methods=['post'], url_path='along-route')
    def along_route(self, request):
        route_data = request.data.get('route')
        if not route_data:
            return Response({'error': 'Route data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        buffer_radius = request.data.get('buffer', 150)
        exclude_ids = request.data.get('exclude_ids', [])

        try:
            if isinstance(route_data, dict) and route_data.get('type') == 'LineString':
                coords = route_data.get('coordinates')
            else:
                coords = route_data

            if not isinstance(coords, list) or len(coords) < 2:
                return Response({'error': 'LineString requires at least 2 coordinates'}, status=status.HTTP_400_BAD_REQUEST)
                
            line = LineString(coords, srid=4326)
        except Exception as e:
            return Response({'error': f'Invalid route format: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        places = self.get_queryset().filter(location__distance_lte=(line, D(m=buffer_radius)))
        if exclude_ids:
            places = places.exclude(id__in=exclude_ids)
            
        page = self.paginate_queryset(places)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(places, many=True)
        return Response(serializer.data)

class RouteCalculateView(APIView):
    def post(self, request):
        places = request.data.get('places', [])
        coordinates = request.data.get('coordinates', [])
        
        if places:
            place_dict = {p.id: p for p in Place.objects.filter(id__in=places)}
            ordered_places = [place_dict[pk] for pk in places if pk in place_dict]
            coordinates = [[p.location.x, p.location.y] for p in ordered_places]

        if len(coordinates) < 2:
            return Response({'error': 'At least 2 points are required to calculate a route.'}, status=status.HTTP_400_BAD_REQUEST)
            
        route_info = ORSClient.get_route(coordinates)
        if not route_info:
            return Response({'error': 'Failed to calculate route.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(route_info)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['is_vibe']
