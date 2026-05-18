import os
import requests
import logging
import math
from django.conf import settings
from django.contrib.gis.geos import LineString, Point
from django.contrib.gis.db.models.functions import Distance
from places.models import Place

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

    @classmethod
    def generate_loop_route_points(cls, start_lon, start_lat, target_distance, vibe_slugs=None, category_slug=None):
        """
        Generates 2-3 points forming a circular route around the start point.
        - target_distance: desired walking distance in meters (e.g. 3000)
        - vibe_slugs: list of tags/vibes to filter
        - category_slug: category slug to filter
        """
        from django.contrib.gis.measure import D
        start_point = Point(start_lon, start_lat, srid=4326)
        
        # Max radius is target_distance / 2.0 to account for winding and ensure we find enough places
        max_radius = target_distance / 2.0
        
        candidates = Place.objects.filter(
            is_active=True, 
            location__distance_lte=(start_point, D(m=max_radius))
        ).annotate(
            distance_from_start=Distance('location', start_point)
        )
        
        if category_slug:
            candidates = candidates.filter(category__slug=category_slug)
            
        if vibe_slugs:
            for slug in vibe_slugs:
                candidates = candidates.filter(tags__slug=slug)
                
        candidate_list = []
        for p in candidates:
            lon, lat = p.location.x, p.location.y
            dist_m = p.distance_from_start.m
            
            # Estimate bearing from start (atan2(y, x))
            bearing = math.atan2(lat - start_lat, lon - start_lon)
            
            candidate_list.append({
                'place': p,
                'distance': dist_m,
                'bearing': bearing,
                'coords': [lon, lat]
            })
            
        # Relax constraints fallback if we don't have enough candidates
        if len(candidate_list) < 2 and vibe_slugs:
            logger.info("Not enough candidates with requested vibes. Retrying without vibe filters.")
            return cls.generate_loop_route_points(start_lon, start_lat, target_distance, vibe_slugs=None, category_slug=category_slug)
            
        # Target radius for intermediate points (around 1/3 of the desired total loop distance)
        target_radius = target_distance / 3.5
        
        sector_a = []
        sector_b = []
        sector_c = []
        
        for c in candidate_list:
            theta = c['bearing']
            if c['distance'] < 150: # Exclude places too close to start
                continue
                
            c['score'] = abs(c['distance'] - target_radius)
            
            # Partition into three 120-degree sectors
            if -math.pi <= theta < -math.pi/3:
                sector_a.append(c)
            elif -math.pi/3 <= theta < math.pi/3:
                sector_b.append(c)
            else:
                sector_c.append(c)
                
        selected_candidates = []
        
        # Sort each sector so the candidate closest to target_radius is first
        sector_a.sort(key=lambda x: x['score'])
        sector_b.sort(key=lambda x: x['score'])
        sector_c.sort(key=lambda x: x['score'])
        
        if sector_a:
            selected_candidates.append(sector_a[0])
        if sector_b:
            selected_candidates.append(sector_b[0])
        if sector_c:
            selected_candidates.append(sector_c[0])
            
        # If we still have fewer than 2 candidates, let's just pick the closest candidate from the entire pool
        if len(selected_candidates) < 2:
            remaining = [c for c in candidate_list if c['distance'] >= 150]
            remaining.sort(key=lambda x: x['score'])
            for c in remaining:
                if c not in selected_candidates:
                    selected_candidates.append(c)
                if len(selected_candidates) >= 2:
                    break
                    
        # Sort the chosen candidates by bearing angle to form a smooth loop
        selected_candidates.sort(key=lambda x: x['bearing'])
        
        return selected_candidates

