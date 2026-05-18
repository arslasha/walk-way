import os
import requests
import logging
from django.conf import settings
from django.contrib.gis.geos import LineString, Point

logger = logging.getLogger(__name__)

class ORSClient:
    BASE_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

    @classmethod
    def get_route(cls, coordinates):
        """
        Accepts a list of [lon, lat] coordinates.
        Returns a dictionary with GeoJSON LineString, distance, and duration.
        """
        api_key = getattr(settings, 'ORS_API_KEY', os.environ.get('ORS_API_KEY'))
        
        if not api_key or api_key == 'mock_key_for_now':
            logger.warning("ORS_API_KEY not found or is mock. Returning straight-line fallback.")
            return cls._get_straight_line_fallback(coordinates)

        headers = {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Authorization': api_key,
            'Content-Type': 'application/json; charset=utf-8'
        }
        
        body = {
            "coordinates": coordinates,
            "instructions": False
        }

        try:
            response = requests.post(cls.BASE_URL, json=body, headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # ORS returns a FeatureCollection, we extract the first route
            feature = data.get('features', [])[0]
            geometry = feature.get('geometry')
            properties = feature.get('properties', {})
            summary = properties.get('summary', {})
            
            return {
                "geometry": geometry,
                "distance": summary.get('distance', 0), # in meters
                "duration": summary.get('duration', 0)  # in seconds
            }
        except Exception as e:
            logger.error(f"ORS API failed: {e}. Returning fallback.")
            return cls._get_straight_line_fallback(coordinates)

    @staticmethod
    def _get_straight_line_fallback(coordinates):
        """
        Fallback that just connects the coordinates with straight lines.
        Estimates distance via PostGIS LineString and assumes 5km/h walking speed.
        """
        if len(coordinates) < 2:
            return None

        # Build LineString to calculate accurate distance
        points = [Point(c[0], c[1], srid=4326) for c in coordinates]
        line = LineString(points, srid=4326)
        
        # Calculate length. In Django with PostGIS, line.length gives degrees if SRID=4326.
        # We need it in meters. Transforming to a projected coordinate system is needed, 
        # or we just use transform(3857) to estimate meters.
        line.transform(3857)
        distance = line.length
        
        # Assume 1.4 m/s walking speed (~5 km/h)
        duration = distance / 1.4

        return {
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "distance": round(distance, 2),
            "duration": round(duration, 2)
        }
