"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useRouteStore } from "@/store/routeStore";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const MOSCOW_CENTER = {
  longitude: 37.6173,
  latitude: 55.7558,
};

export default function MapPage() {
  const { route } = useRouteStore();
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);

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
      mapRef.current.fitBounds(bounds, {
        padding: 50,
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

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden">
      {/* Absolute Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-30 flex items-center justify-between pointer-events-none">
        <Link
          href="/explore"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-md shadow-md pointer-events-auto hover:bg-background transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Link>
      </div>

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
        >
          <NavigationControl position="bottom-right" />

          {/* Render Route Markers */}
          {route.map((place, index) => (
            <Marker
              key={place.id}
              longitude={place.geometry.coordinates[0]}
              latitude={place.geometry.coordinates[1]}
              anchor="bottom"
            >
              <div className="relative group cursor-pointer">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    "bg-accent text-white font-bold text-sm shadow-lg",
                    "border-2 border-background",
                    "transform transition-transform group-hover:scale-110",
                    "z-10 relative"
                  )}
                >
                  {index + 1}
                </div>
                {/* Optional marker pointer/pin base */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rotate-45 z-0" />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  <div className="bg-surface text-text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-border">
                    {place.properties.title}
                  </div>
                </div>
              </div>
            </Marker>
          ))}
        </Map>
      </div>
    </div>
  );
}
