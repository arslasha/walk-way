"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Map, { Marker, NavigationControl, MapRef, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useRouteStore } from "@/store/routeStore";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { RouteBottomSheet } from "@/components/features/route/RouteBottomSheet";
import { Navbar } from "@/components/layout/Navbar";
import { PlaceFeature } from "@/types/place";

const MOSCOW_CENTER = {
  longitude: 37.6173,
  latitude: 55.7558,
};

export default function MapPage() {
  const { route, routeGeometry, alongRoutePlaces, addPlace } = useRouteStore();
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const [activePlaceId, setActivePlaceId] = useState<number | null>(null);

  const geojsonRoute = useMemo(() => {
    if (!routeGeometry) return null;
    return {
      type: "Feature" as const,
      properties: {},
      geometry: routeGeometry,
    };
  }, [routeGeometry]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset fit bounds when route changes so we re-fit for the new route
  useEffect(() => {
    setHasFitBounds(false);
  }, [route]);

  // Calculate bounds based on route
  useEffect(() => {
    if (!mapRef.current || route.length === 0 || !isMapLoaded || hasFitBounds) return;

    const bounds = new maplibregl.LngLatBounds();
    route.forEach((place) => {
      bounds.extend([place.geometry.coordinates[0], place.geometry.coordinates[1]]);
    });

    if (!bounds.isEmpty()) {
      const isDesktop = window.innerWidth >= 768;
      mapRef.current.fitBounds(bounds, {
        padding: {
          top: 80,
          bottom: 80,
          left: isDesktop ? 420 : 60, // Shift center to the right to avoid overlapping with desktop sidebar
          right: 60,
        },
        maxZoom: 16,
        duration: 1000,
      });
      setHasFitBounds(true);
    }
  }, [route, hasFitBounds, isMapLoaded]);

  const initialViewState = useMemo(() => {
    if (route.length > 0) {
      return {
        longitude: route[0].geometry.coordinates[0],
        latitude: route[0].geometry.coordinates[1],
        zoom: 13,
      };
    }
    return {
      ...MOSCOW_CENTER,
      zoom: 11,
    };
  }, []); // Only on initial mount

  const mapStyle =
    mounted && resolvedTheme === "light"
      ? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  const handleSelectPlace = (place: PlaceFeature) => {
    setActivePlaceId(place.id);
    mapRef.current?.flyTo({
      center: [place.geometry.coordinates[0], place.geometry.coordinates[1]],
      zoom: 15,
      duration: 1000,
    });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      <Navbar />

      {/* Preloader */}
      {(!mounted || !isMapLoaded) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-accent mb-4"></div>
          <p className="text-body-md font-medium text-muted-foreground animate-pulse">
            Загрузка карты...
          </p>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative z-10">
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          mapStyle={mapStyle}
          attributionControl={false}
          onLoad={() => setIsMapLoaded(true)}
          onClick={() => setActivePlaceId(null)}
        >
          <NavigationControl position="bottom-right" />

          {/* Render Walking Route Polyline with a Glowing Accent Line */}
          {geojsonRoute && (
            <Source key={resolvedTheme} id="route-source" type="geojson" data={geojsonRoute}>
              {/* Outer glow layer */}
              <Layer
                id="route-line-glow"
                type="line"
                layout={{
                  "line-join": "round",
                  "line-cap": "round",
                }}
                paint={{
                  "line-color": "#E86A3A",
                  "line-width": 10,
                  "line-opacity": 0.25,
                }}
              />
              {/* Core solid layer */}
              <Layer
                id="route-line-core"
                type="line"
                layout={{
                  "line-join": "round",
                  "line-cap": "round",
                }}
                paint={{
                  "line-color": "#E86A3A",
                  "line-width": 4.5,
                  "line-opacity": 0.95,
                }}
              />
            </Source>
          )}

          {/* Render Route Markers */}
          {route.map((place, index) => (
            <Marker
              key={place.id}
              longitude={place.geometry.coordinates[0]}
              latitude={place.geometry.coordinates[1]}
              anchor="bottom"
            >
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlace(place);
                }}
                className="relative group cursor-pointer"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-lg border-2 border-background z-10 relative transition-all duration-300",
                    activePlaceId === place.id
                      ? "bg-accent text-white scale-125 ring-4 ring-accent/30 border-white"
                      : "bg-accent text-white group-hover:scale-110"
                  )}
                >
                  {index + 1}
                </div>
                {/* Optional marker pointer/pin base */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rotate-45 z-0" />
                
                {/* Tooltip on hover or active */}
                <div 
                  className={cn(
                    "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none whitespace-nowrap z-20",
                    activePlaceId === place.id
                      ? "opacity-100 scale-100"
                      : "opacity-0 group-hover:opacity-100 scale-95"
                  )}
                >
                  <div className="bg-surface text-text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-border">
                    {place.properties.title}
                  </div>
                </div>
              </div>
            </Marker>
          ))}

          {/* Render Smart POIs Along the Route */}
          {alongRoutePlaces
            .filter((place) => !route.some((p) => p.id === place.id))
            .map((place) => (
              <Marker
                key={`along-${place.id}`}
                longitude={place.geometry.coordinates[0]}
                latitude={place.geometry.coordinates[1]}
                anchor="center"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlaceId(place.id);
                  }}
                  className="relative group cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shadow-md border border-white transition-all duration-300",
                      activePlaceId === place.id
                        ? "bg-accent scale-150 ring-2 ring-accent/30"
                        : "bg-accent/40 hover:bg-accent hover:scale-125"
                    )}
                  />
                  
                  {/* Popup/tooltip showing title and an Add button */}
                  {activePlaceId === place.id && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                      <div className="bg-surface text-text-primary text-xs font-semibold p-2.5 rounded-2xl shadow-xl border border-border flex flex-col items-center gap-1.5 min-w-[140px]">
                        <div className="text-center font-bold leading-tight">{place.properties.title}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addPlace(place);
                            setActivePlaceId(null);
                          }}
                          className="bg-accent hover:bg-accent-hover text-white text-[10px] font-bold px-2 py-1 rounded-full w-full transition-colors"
                        >
                          Добавить
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Marker>
            ))}
        </Map>
      </div>

      {/* Floating Bottom Sheet (Mobile) & Side Panel (Desktop) */}
      {isMapLoaded && (
        <RouteBottomSheet 
          onSelectPlace={handleSelectPlace}
          activePlaceId={activePlaceId}
        />
      )}
    </div>
  );
}

