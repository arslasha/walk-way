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
        try:
            buffer_radius = float(buffer_radius)
            if buffer_radius <= 0:
                return Response({'error': 'Buffer radius must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Buffer radius must be a valid number.'}, status=status.HTTP_400_BAD_REQUEST)

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
        is_loop = request.data.get('is_loop', False)
        
        if is_loop:
            start_coords = request.data.get('start_coords') or request.data.get('coordinates', [])
            if not start_coords or len(start_coords) < 2:
                return Response({'error': 'start_coords [lon, lat] is required for loop routes.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if isinstance(start_coords[0], list):
                start_coords = start_coords[0]
                
            try:
                start_lon, start_lat = float(start_coords[0]), float(start_coords[1])
                if not (-180 <= start_lon <= 180) or not (-90 <= start_lat <= 90):
                    return Response({'error': 'Coordinates out of bounds.'}, status=status.HTTP_400_BAD_REQUEST)
                distance = float(request.data.get('distance', 3000))
                if distance <= 0:
                    return Response({'error': 'Distance must be positive.'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid format for start_coords or distance.'}, status=status.HTTP_400_BAD_REQUEST)
                
            vibe_slugs = request.data.get('vibes', [])
            category_slug = request.data.get('category')
            
            selected_items = ORSClient.generate_loop_route_points(
                start_lon, start_lat, distance, vibe_slugs, category_slug
            )
            
            if not selected_items:
                return Response({'error': 'No suitable places found to build a circular route.'}, status=status.HTTP_404_NOT_FOUND)
                
            coords = [[start_lon, start_lat]]
            for item in selected_items:
                coords.append(item['coords'])
            coords.append([start_lon, start_lat])
            
            route_info = ORSClient.get_route(coords)
            if not route_info:
                return Response({'error': 'Failed to calculate circular route.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            places_list = [item['place'] for item in selected_items]
            serialized_places = PlaceSerializer(places_list, many=True, context={'request': request}).data
            
            return Response({
                'route': route_info,
                'places': serialized_places
            })
            
        else:
            places = request.data.get('places', [])
            coordinates = request.data.get('coordinates', [])
            print("DEBUG RouteCalculateView - places input:", places)
            print("DEBUG RouteCalculateView - coordinates input:", coordinates)
            
            if places:
                try:
                    places = [int(pk) for pk in places]
                except (ValueError, TypeError) as e:
                    print("DEBUG casting error:", e)
                    return Response({'error': 'Invalid place IDs provided.'}, status=status.HTTP_400_BAD_REQUEST)
                print("DEBUG places cast to int:", places)
                place_dict = {p.id: p for p in Place.objects.filter(id__in=places)}
                print("DEBUG place_dict keys:", list(place_dict.keys()))
                ordered_places = [place_dict[pk] for pk in places if pk in place_dict]
                print("DEBUG ordered_places length:", len(ordered_places))
                coordinates = [[p.location.x, p.location.y] for p in ordered_places]
                print("DEBUG coordinates output:", coordinates)

            if not isinstance(coordinates, list) or len(coordinates) < 2:
                return Response({'error': 'At least 2 points are required to calculate a route.'}, status=status.HTTP_400_BAD_REQUEST)
            
            validated_coords = []
            for coord in coordinates:
                if not isinstance(coord, list) or len(coord) < 2:
                    return Response({'error': 'Each coordinate must be a [lon, lat] list.'}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    lon, lat = float(coord[0]), float(coord[1])
                    if not (-180 <= lon <= 180) or not (-90 <= lat <= 90):
                        return Response({'error': 'Coordinates out of bounds.'}, status=status.HTTP_400_BAD_REQUEST)
                    validated_coords.append([lon, lat])
                except (ValueError, TypeError):
                    return Response({'error': 'Coordinates must contain valid float values.'}, status=status.HTTP_400_BAD_REQUEST)

            route_info = ORSClient.get_route(validated_coords)
            if not route_info:
                return Response({'error': 'Failed to calculate route.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            return Response(route_info)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['is_vibe']
