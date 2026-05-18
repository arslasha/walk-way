# Task 010: Backend Routing API & "Along the Way" Spatial Queries

**Assignee:** Backend Agent
**Status:** Not Started

## Context
With the frontend map (`react-map-gl`) and route drawer (`vaul`) implemented, we need the brain: calculating the actual walking route polyline and recommending nearby places "along the path". We will use the OpenRouteService (ORS) API on the backend to fetch walking polylines and PostGIS spatial queries (`ST_DWithin` on a `LineString`) to find matching places.

## Requirements

1. **Setup OpenRouteService Client on Backend**
   - We will proxy routing requests through the Django backend to keep the API key secure.
   - Sign up for a free ORS key (or use a mock if offline/requested). Add `ORS_API_KEY` to the `.env` file.
   - Implement an ORS client helper/service in `backend/places/services.py` that accepts an array of coordinates and returns the walking route GeoJSON (polyline geometry, distance, and duration).

2. **Create Route Calculation Endpoints**
   - Add a POST endpoint `/api/routes/calculate/` in Django:
     - Accepts a list of coordinate pairs or place IDs: `[place_id_1, place_id_2, ...]`.
     - Calls ORS to calculate the walking path.
     - Returns the full route GeoJSON (including the `LineString` geometry of the path, total distance in meters, and walking duration in seconds).

3. **Implement "Along the Way" Spatial Logic**
   - Once a path is generated, the frontend needs to show matching places along this path.
   - Create a GET endpoint `/api/places/along-route/` (or extend `/api/places/` filters):
     - Accepts a GeoJSON `LineString` (or a list of coordinates representing the active route path) and a `buffer` radius in meters (default to 150m).
     - In Python/Django, convert the coordinates to a PostGIS `LineString` object.
     - Perform a spatial filter: `Place.objects.filter(location__dwithin=(route_line_geom, buffer_distance))` (excluding places already in the active route).
     - Prioritize/sort results by distance to the nearest point on the route or by vibe matches.

4. **Frontend Integration**
   - **Map Rendering:** Render the walking route line on the MapLibre instance using a custom geojson Source and Layer (e.g., a thick, semi-transparent accent-colored line).
   - **Smart POIs on Map:** Display returned "along the route" places as tiny interactive dots on the map. Clicking them opens a popup allowing the user to add them into the route store.
   - **Explore Feed Integration:** Update the `/explore` feed to display an "Along the Way" (По пути) section at the top whenever a route is active, querying this new API.

## Constraints & Rules
- ORS API calls must have error fallback mechanisms (e.g., return a straight-line fallback if ORS fails or rate limits).
- Use proper Django REST Framework serialization.
- Ensure PostGIS spatial queries are indexed and fast.
- Follow `version-control-protocol.md`. Do not commit directly.

## Status Check
- [ ] ORS client implemented and API keys set up.
- [ ] `/api/routes/calculate/` endpoint returns accurate walking paths.
- [ ] PostGIS `ST_DWithin` spatial query successfully finds places within a buffer of the path.
- [ ] MapLibre map renders the route polyline successfully.
- [ ] Smart POIs appear on the map and can be added to the route.
- [ ] "По пути" section displays at the top of the Explore feed.
