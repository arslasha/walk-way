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

    # Advanced filter parameters
    current_time = filters.CharFilter(method='filter_by_current_time')
    weather = filters.CharFilter(method='filter_by_weather')
    price_level = filters.CharFilter(method='filter_by_price_level')

    class Meta:
        model = Place
        fields = ['category', 'is_active', 'price_level', 'is_indoor']

    def filter_by_current_time(self, queryset, name, value):
        if not value:
            return queryset
            
        from .utils import get_day_and_time, is_open_at
        day, time_str = get_day_and_time(value)
        
        # Candidate filtering: select IDs and opening_hours
        places_data = queryset.values_list('id', 'opening_hours')
        
        open_ids = []
        for pk, schedule in places_data:
            if is_open_at(schedule, day, time_str):
                open_ids.append(pk)
                
        return queryset.filter(id__in=open_ids)

    def filter_by_weather(self, queryset, name, value):
        if value == 'rain':
            # Filter indoor places when it is raining
            return queryset.filter(is_indoor=True)
        return queryset

    def filter_by_price_level(self, queryset, name, value):
        if not value:
            return queryset
            
        try:
            levels = [int(x.strip()) for x in value.split(',')]
            return queryset.filter(price_level__in=levels)
        except ValueError:
            return queryset

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
