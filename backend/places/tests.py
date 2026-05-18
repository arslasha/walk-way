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
        is_active=True,
        price_level=0,
        is_indoor=False,
        opening_hours={'mon': [['10:00', '18:00']], 'tue': [['10:00', '18:00']], 'wed': [['10:00', '18:00']], 'thu': [['10:00', '18:00']], 'fri': [['10:00', '18:00']], 'sat': [['10:00', '18:00']], 'sun': [['10:00', '18:00']]}
    )
    place1.tags.add(tag1)
    
    # ~400m away (longitudinally)
    place2 = Place.objects.create(
        title="Nearby Cafe",
        location=Point(30.3230, 59.9390, srid=4326),
        category=category,
        is_active=True,
        price_level=1,
        is_indoor=True,
        opening_hours={'mon': [['12:00', '03:00']], 'tue': [['12:00', '03:00']], 'wed': [['12:00', '03:00']], 'thu': [['12:00', '03:00']], 'fri': [['12:00', '03:00']], 'sat': [['12:00', '03:00']], 'sun': [['12:00', '03:00']]}
    )
    place2.tags.add(tag1, tag2)
    
    # ~1.5km away
    place3 = Place.objects.create(
        title="Far Cafe",
        location=Point(30.3428, 59.9390, srid=4326),
        category=category,
        is_active=True,
        price_level=2,
        is_indoor=True,
        opening_hours={'mon': [['12:00', '23:00']], 'tue': [['12:00', '23:00']], 'wed': [['12:00', '23:00']], 'thu': [['12:00', '23:00']], 'fri': [['12:00', '23:00']], 'sat': [['12:00', '23:00']], 'sun': [['12:00', '23:00']]}
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


@pytest.mark.django_db
def test_route_calculate_by_coordinates(api_client):
    url = reverse('route-calculate')
    payload = {
        "coordinates": [
            [30.3158, 59.9390],
            [30.3230, 59.9390]
        ]
    }
    response = api_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert 'geometry' in data
    assert data['geometry']['type'] == 'LineString'
    assert 'distance' in data
    assert 'duration' in data


@pytest.mark.django_db
def test_route_calculate_by_places(api_client, setup_data):
    url = reverse('route-calculate')
    payload = {
        "places": [setup_data['place1'].id, setup_data['place2'].id]
    }
    response = api_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert 'geometry' in data
    assert data['geometry']['type'] == 'LineString'
    assert data['distance'] > 0


@pytest.mark.django_db
def test_route_calculate_invalid_payload(api_client):
    url = reverse('route-calculate')
    
    # 1. Less than 2 coordinates
    payload_less_points = {"coordinates": [[30.3158, 59.9390]]}
    response = api_client.post(url, payload_less_points, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Out of bounds coordinates (lat > 90)
    payload_out_bounds = {"coordinates": [[30.3158, 95.9390], [30.3230, 59.9390]]}
    response = api_client.post(url, payload_out_bounds, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Negative coordinates are mathematically valid (Southern/Western hemisphere)
    payload_negative = {"coordinates": [[-30.3158, -59.9390], [-30.3230, -59.9390]]}
    response = api_client.post(url, payload_negative, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['geometry']['type'] == 'LineString'

    # 4. Malformed/non-numeric values
    payload_malformed = {"coordinates": [[30.3158, "invalid"], [30.3230, 59.9390]]}
    response = api_client.post(url, payload_malformed, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_places_along_route(api_client, setup_data):
    url = reverse('place-along-route')
    
    # Define route directly between place1 and place2
    payload = {
        "route": {
            "type": "LineString",
            "coordinates": [
                [30.3158, 59.9390],
                [30.3230, 59.9390]
            ]
        },
        "buffer": 150 # meters
    }
    
    response = api_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_200_OK
    
    # Should return Center Cafe and Nearby Cafe which are right on/near this path
    features = response.json()['features']
    assert len(features) == 2
    titles = [f['properties']['title'] for f in features]
    assert "Center Cafe" in titles
    assert "Nearby Cafe" in titles
    assert "Far Cafe" not in titles


@pytest.mark.django_db
def test_places_along_route_exclude_ids(api_client, setup_data):
    url = reverse('place-along-route')
    
    payload = {
        "route": {
            "type": "LineString",
            "coordinates": [
                [30.3158, 59.9390],
                [30.3230, 59.9390]
            ]
        },
        "buffer": 150,
        "exclude_ids": [setup_data['place1'].id]
    }
    
    response = api_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_200_OK
    features = response.json()['features']
    assert len(features) == 1
    assert features[0]['properties']['title'] == "Nearby Cafe"


@pytest.mark.django_db
def test_place_filter_by_price_level(api_client, setup_data):
    url = reverse('place-list')
    
    # Filter by price level 0 (Center Cafe)
    response_0 = api_client.get(url, {'price_level': '0'})
    assert len(response_0.json()['features']) == 1
    assert response_0.json()['features'][0]['properties']['title'] == "Center Cafe"

    # Filter by price level 0 and 1 (Center Cafe, Nearby Cafe)
    response_0_1 = api_client.get(url, {'price_level': '0,1'})
    assert len(response_0_1.json()['features']) == 2
    titles = [f['properties']['title'] for f in response_0_1.json()['features']]
    assert "Center Cafe" in titles
    assert "Nearby Cafe" in titles


@pytest.mark.django_db
def test_place_filter_by_weather(api_client, setup_data):
    url = reverse('place-list')
    
    # Under clear weather, should return all
    response_clear = api_client.get(url, {'weather': 'clear'})
    assert len(response_clear.json()['features']) == 3

    # Under rain, should return only indoor cafes (Nearby Cafe, Far Cafe)
    response_rain = api_client.get(url, {'weather': 'rain'})
    assert len(response_rain.json()['features']) == 2
    titles = [f['properties']['title'] for f in response_rain.json()['features']]
    assert "Nearby Cafe" in titles
    assert "Far Cafe" in titles
    assert "Center Cafe" not in titles


@pytest.mark.django_db
def test_place_filter_by_current_time(api_client, setup_data):
    url = reverse('place-list')
    
    # Monday at 11:00 AM (Center Cafe is open 10-18, others open at 12:00)
    response_11am = api_client.get(url, {'current_time': '2026-05-18T11:00:00'})
    features = response_11am.json()['features']
    assert len(features) == 1
    assert features[0]['properties']['title'] == "Center Cafe"

    # Monday at 14:00 PM (all cafes are open)
    response_2pm = api_client.get(url, {'current_time': '2026-05-18T14:00:00'})
    assert len(response_2pm.json()['features']) == 3

    # Monday at 22:00 PM (Center is closed, Nearby Cafe 12-03 is open, Far Cafe 12-23 is open)
    response_10pm = api_client.get(url, {'current_time': '2026-05-18T22:00:00'})
    assert len(response_10pm.json()['features']) == 2
    titles = [f['properties']['title'] for f in response_10pm.json()['features']]
    assert "Nearby Cafe" in titles
    assert "Far Cafe" in titles

    # Tuesday at 01:00 AM (which checks Monday's wrap-around 12:00 to 03:00)
    # 2026-05-19 is Tuesday
    response_1am_tue = api_client.get(url, {'current_time': '2026-05-19T01:00:00'})
    assert len(response_1am_tue.json()['features']) == 1
    assert response_1am_tue.json()['features'][0]['properties']['title'] == "Nearby Cafe"


@pytest.mark.django_db
def test_route_calculate_circular_loop(api_client, setup_data):
    import unittest.mock
    url = reverse('route-calculate')
    payload = {
        "is_loop": True,
        "start_coords": [30.3158, 59.9390],
        "distance": 3000
    }
    
    mock_ors_response = {
        "features": [
            {
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [30.3158, 59.9390],
                        [30.3230, 59.9390],
                        [30.3428, 59.9390],
                        [30.3158, 59.9390]
                    ]
                },
                "properties": {
                    "summary": {
                        "distance": 3200.0,
                        "duration": 2200.0
                    }
                }
            }
        ]
    }
    
    with unittest.mock.patch('requests.post') as mock_post:
        mock_response = unittest.mock.Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_ors_response
        mock_post.return_value = mock_response
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should contain route info
        assert 'route' in data
        assert 'geometry' in data['route']
        assert data['route']['geometry']['type'] == 'LineString'
        
        # First and last coordinates should match the starting coords
        coords = data['route']['geometry']['coordinates']
        assert coords[0] == [30.3158, 59.9390]
        assert coords[-1] == [30.3158, 59.9390]
        
        # Should return serialized places along the loop route
        assert 'places' in data
        assert len(data['places']) >= 1


@pytest.mark.django_db
def test_route_calculate_ors_success(api_client, settings):
    import requests
    import unittest.mock
    settings.ORS_API_KEY = "valid_key"
    url = reverse('route-calculate')
    payload = {
        "coordinates": [
            [30.3158, 59.9390],
            [30.3230, 59.9390]
        ]
    }
    
    mock_ors_response = {
        "features": [
            {
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [30.3158, 59.9390],
                        [30.3230, 59.9390]
                    ]
                },
                "properties": {
                    "summary": {
                        "distance": 850.5,
                        "duration": 607.0
                    }
                }
            }
        ]
    }
    
    with unittest.mock.patch('requests.post') as mock_post:
        mock_response = unittest.mock.Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_ors_response
        mock_post.return_value = mock_response
        
        response = api_client.post(url, payload, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['distance'] == 850.5
        assert data['duration'] == 607.0
        assert data['geometry']['coordinates'] == [[30.3158, 59.9390], [30.3230, 59.9390]]
        mock_post.assert_called_once()


@pytest.mark.django_db
def test_route_calculate_ors_failure_fallback(api_client, settings):
    import requests
    import unittest.mock
    settings.ORS_API_KEY = "valid_key"
    url = reverse('route-calculate')
    payload = {
        "coordinates": [
            [30.3158, 59.9390],
            [30.3230, 59.9390]
        ]
    }
    
    with unittest.mock.patch('requests.post', side_effect=requests.RequestException("Rate limit exceeded")) as mock_post:
        response = api_client.post(url, payload, format='json')
        
        # Should gracefully fall back to straight line and return 200 OK
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['distance'] > 0
        assert data['duration'] > 0
        assert data['geometry']['type'] == 'LineString'
        mock_post.assert_called_once()


@pytest.mark.django_db
def test_places_along_route_invalid_buffer(api_client, setup_data):
    url = reverse('place-along-route')
    
    payload_negative = {
        "route": {
            "type": "LineString",
            "coordinates": [
                [30.3158, 59.9390],
                [30.3230, 59.9390]
            ]
        },
        "buffer": -50
    }
    response = api_client.post(url, payload_negative, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    payload_invalid = {
        "route": {
            "type": "LineString",
            "coordinates": [
                [30.3158, 59.9390],
                [30.3230, 59.9390]
            ]
        },
        "buffer": "invalid"
    }
    response = api_client.post(url, payload_invalid, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST


