import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.gis.geos import Point

from .models import Category, Tag, Place

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data(db):
    category = Category.objects.create(name="Cafe", slug="cafe")
    
    tag1 = Tag.objects.create(name="Cozy", slug="cozy", is_vibe=True)
    tag2 = Tag.objects.create(name="Loud", slug="loud", is_vibe=False)
    
    # Center point (SPb)
    place1 = Place.objects.create(
        title="Center Cafe",
        location=Point(30.3158, 59.9390, srid=4326), # lon, lat
        category=category,
        is_active=True
    )
    place1.tags.add(tag1)
    
    # ~400m away (longitudinally)
    place2 = Place.objects.create(
        title="Nearby Cafe",
        location=Point(30.3230, 59.9390, srid=4326),
        category=category,
        is_active=True
    )
    place2.tags.add(tag1, tag2)
    
    # ~1.5km away
    place3 = Place.objects.create(
        title="Far Cafe",
        location=Point(30.3428, 59.9390, srid=4326),
        category=category,
        is_active=True
    )
    place3.tags.add(tag2)

    return {
        'category': category,
        'tag1': tag1,
        'tag2': tag2,
        'place1': place1,
        'place2': place2,
        'place3': place3
    }

@pytest.mark.django_db
def test_place_list_geojson_format(api_client, setup_data):
    url = reverse('place-list')
    response = api_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data['type'] == 'FeatureCollection'
    assert 'features' in data
    assert len(data['features']) == 3

@pytest.mark.django_db
def test_place_filter_by_category(api_client, setup_data):
    url = reverse('place-list')
    response = api_client.get(url, {'category': 'cafe'})
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()['features']) == 3
    
    response_empty = api_client.get(url, {'category': 'park'})
    assert len(response_empty.json()['features']) == 0

@pytest.mark.django_db
def test_place_filter_by_tags(api_client, setup_data):
    url = reverse('place-list')
    
    # Filter by cozy (place1, place2)
    response_cozy = api_client.get(url, {'tags': 'cozy'})
    assert len(response_cozy.json()['features']) == 2
    
    # Filter by loud (place2, place3)
    response_loud = api_client.get(url, {'tags': 'loud'})
    assert len(response_loud.json()['features']) == 2
    
    # Filter by cozy AND loud (only place2)
    response_both = api_client.get(url, {'tags': 'cozy,loud'})
    assert len(response_both.json()['features']) == 1
    assert response_both.json()['features'][0]['properties']['title'] == "Nearby Cafe"

@pytest.mark.django_db
def test_place_spatial_filter(api_client, setup_data):
    url = reverse('place-list')
    
    lat = 59.9390
    lon = 30.3158
    
    # 1. Default radius (1000m) should find place1 and place2
    response_default = api_client.get(url, {'lat': lat, 'lon': lon})
    assert response_default.status_code == status.HTTP_200_OK
    features = response_default.json()['features']
    assert len(features) == 2
    titles = [f['properties']['title'] for f in features]
    assert "Center Cafe" in titles
    assert "Nearby Cafe" in titles

    # 2. Small radius (100m) should find only place1
    response_small = api_client.get(url, {'lat': lat, 'lon': lon, 'radius': 100})
    features = response_small.json()['features']
    assert len(features) == 1
    assert features[0]['properties']['title'] == "Center Cafe"

    # 3. Large radius (2000m) should find all three
    response_large = api_client.get(url, {'lat': lat, 'lon': lon, 'radius': 2000})
    features = response_large.json()['features']
    assert len(features) == 3
