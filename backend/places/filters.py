from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django_filters import rest_framework as filters
from .models import Place

class PlaceFilter(filters.FilterSet):
    category = filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    tags = filters.CharFilter(method='filter_by_tags')
    
    # Spatial filter parameters
    lat = filters.NumberFilter(method='filter_by_distance')
    lon = filters.NumberFilter(method='filter_by_distance')
    radius = filters.NumberFilter(method='filter_by_distance')

    class Meta:
        model = Place
        fields = ['category', 'is_active']

    def filter_by_tags(self, queryset, name, value):
        # Allow multiple tags separated by comma
        tag_slugs = value.split(',')
        for slug in tag_slugs:
            queryset = queryset.filter(tags__slug=slug.strip())
        return queryset

    def filter_by_distance(self, queryset, name, value):
        # We only apply the spatial filter if BOTH lat and lon are present in the request
        lat = self.data.get('lat')
        lon = self.data.get('lon')
        
        if lat and lon:
            try:
                # Default radius is 1000 meters (1km) as requested by user
                radius = float(self.data.get('radius', 1000))
                point = Point(float(lon), float(lat), srid=4326)
                return queryset.filter(location__distance_lte=(point, D(m=radius)))
            except (ValueError, TypeError):
                pass
        
        return queryset
