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
import { Loader } from "@/components/ui/Loader";

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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
          <Loader message="Загрузка карты..." size="lg" />
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
                    "absolute bottom-full mb-3 left-1/2 -translate-x-1/2 transition-[opacity,transform] duration-200 pointer-events-none z-20 w-[220px] [backface-visibility:hidden] [transform-style:preserve-3d]",
                    activePlaceId === place.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                  )}
                >
                  <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 flex items-start gap-2">
                    {place.properties.photos && place.properties.photos.length > 0 ? (
                      <img
                        src={place.properties.photos[0]}
                        alt={place.properties.title}
                        className="h-12 w-12 rounded-xl object-cover shrink-0"
                        style={{ imageRendering: "auto" }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold leading-tight line-clamp-1">{place.properties.title}</p>
                      {place.properties.description && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-snug">{place.properties.description}</p>
                      )}
                    </div>
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
                  
                  {/* Popup: photo, title, description + Add button */}
                  {activePlaceId === place.id && (
                    <div
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[240px] animate-in fade-in slide-in-from-bottom-1 duration-150"
                      style={{ willChange: "transform" }}
                    >
                      <div className="bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
                        {place.properties.photos && place.properties.photos.length > 0 && (
                          <img
                            src={place.properties.photos[0]}
                            alt={place.properties.title}
                            className="w-full h-[100px] object-cover"
                          />
                        )}
                        <div className="p-2.5 space-y-1.5">
                          <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{place.properties.title}</p>
                          {place.properties.description && (
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">{place.properties.description}</p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addPlace(place);
                              setActivePlaceId(null);
                            }}
                            className="w-full mt-1 bg-accent hover:bg-accent/90 text-white text-[10px] font-bold px-2 py-1.5 rounded-full transition-colors"
                          >
                            Добавить в маршрут
                          </button>
                        </div>
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

