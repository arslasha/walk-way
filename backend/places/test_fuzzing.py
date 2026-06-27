import pytest
import requests
from unittest.mock import patch
from rest_framework import status
from django.urls import reverse
from hypothesis import given, strategies as st, settings
from django.contrib.auth import get_user_model

User = get_user_model()

# We define random payload strategies to test API resilience

# Coordinate element strategy (can be a float, a string, a list, or anything)
coord_element_strategy = st.one_of(
    st.floats(allow_nan=False, allow_infinity=False),
    st.text(),
    st.none(),
    st.integers()
)

# Start coordinates list strategy
start_coords_strategy = st.one_of(
    st.lists(coord_element_strategy, min_size=0, max_size=5),
    st.dictionaries(st.text(), st.text()),
    st.text(),
    st.none()
)

# Distance strategy
distance_strategy = st.one_of(
    st.floats(allow_nan=False, allow_infinity=False),
    st.text(),
    st.integers(),
    st.none()
)

# Vibes strategy
vibes_strategy = st.one_of(
    st.lists(st.text(), min_size=0, max_size=5),
    st.text(),
    st.none()
)

# Places list strategy
places_strategy = st.one_of(
    st.lists(st.one_of(st.integers(), st.text()), min_size=0, max_size=5),
    st.text(),
    st.none()
)

@pytest.mark.django_db
@settings(max_examples=50, deadline=None)
@given(
    start_coords=start_coords_strategy,
    distance=distance_strategy,
    vibes=vibes_strategy,
    is_loop=st.booleans()
)
def test_route_calculation_loop_fuzz(start_coords, distance, vibes, is_loop):
    from rest_framework.test import APIClient
    api_client = APIClient()
    url = reverse('route-calculate')
    
    # We patch requests.post to avoid hitting the actual ORS API during fuzzing
    with patch('requests.post') as mock_post:
        # Mock ORS response
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "features": [{
                "geometry": {"type": "LineString", "coordinates": [[37.6, 55.7], [37.61, 55.71]]},
                "properties": {"summary": {"distance": 1000, "duration": 600}}
            }]
        }
        
        payload = {
            'is_loop': is_loop,
            'start_coords': start_coords,
            'distance': distance,
            'vibes': vibes
        }
        
        response = api_client.post(url, payload, format='json')
        
        # Verify that the view never returns 500 (Internal Server Error)
        # It must either return 200 (Success) or 400 (Bad Request)
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.django_db
@settings(max_examples=50, deadline=None)
@given(
    places=places_strategy,
    coordinates=st.one_of(
        st.lists(st.lists(coord_element_strategy, min_size=0, max_size=3), min_size=0, max_size=5),
        st.text(),
        st.none()
    )
)
def test_route_calculation_standard_fuzz(places, coordinates):
    from rest_framework.test import APIClient
    api_client = APIClient()
    url = reverse('route-calculate')
    
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "features": [{
                "geometry": {"type": "LineString", "coordinates": [[37.6, 55.7], [37.61, 55.71]]},
                "properties": {"summary": {"distance": 1000, "duration": 600}}
            }]
        }
        
        payload = {
            'is_loop': False,
            'places': places,
            'coordinates': coordinates
        }
        
        response = api_client.post(url, payload, format='json')
        assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.django_db
@settings(max_examples=50, deadline=None)
@given(
    lat=st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.text(), st.none()),
    lon=st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.text(), st.none()),
    radius=st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.text(), st.none()),
    category=st.one_of(st.text(), st.none()),
    tags=st.one_of(st.text(), st.none())
)
def test_place_list_filters_fuzz(lat, lon, radius, category, tags):
    from rest_framework.test import APIClient
    api_client = APIClient()
    url = reverse('place-list')
    
    params = {}
    if lat is not None: params['lat'] = lat
    if lon is not None: params['lon'] = lon
    if radius is not None: params['radius'] = radius
    if category is not None: params['category'] = category
    if tags is not None: params['tags'] = tags
    
    response = api_client.get(url, params)
    assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.django_db
@settings(max_examples=50, deadline=None)
@given(
    route=st.one_of(
        st.lists(st.lists(coord_element_strategy, min_size=0, max_size=3), min_size=0, max_size=5),
        st.text(),
        st.none()
    ),
    buffer=st.one_of(st.floats(allow_nan=False, allow_infinity=False), st.text(), st.none())
)
def test_place_along_route_fuzz(route, buffer):
    from rest_framework.test import APIClient
    api_client = APIClient()
    url = reverse('place-along-route')
    
    payload = {}
    if route is not None: payload['route'] = route
    if buffer is not None: payload['buffer'] = buffer
    
    response = api_client.post(url, payload, format='json')
    assert response.status_code != status.HTTP_500_INTERNAL_SERVER_ERROR
