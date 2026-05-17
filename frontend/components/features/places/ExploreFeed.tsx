"use client";

import React, { useMemo } from "react";
import { PlaceFeature } from "@/types/place";
import { PlaceCard } from "./PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouteStore } from "@/store/routeStore";

interface ExploreFeedProps {
  initialPlaces: PlaceFeature[];
}

// Simple Haversine distance calculation in kilometers
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ExploreFeed({ initialPlaces }: ExploreFeedProps) {
  const { route } = useRouteStore();

  const { onTheWayPlaces, otherPlaces } = useMemo(() => {
    if (route.length === 0 || initialPlaces.length === 0) {
      return { onTheWayPlaces: [], otherPlaces: initialPlaces };
    }

    const firstPoint = route[0];
    const firstPointCoords = firstPoint.geometry.coordinates; // [lon, lat]

    const onTheWay: PlaceFeature[] = [];
    const other: PlaceFeature[] = [];

    initialPlaces.forEach((place) => {
      // Don't show the first point in the feed as it's already in the route, 
      // or we can show it but maybe not in "on the way".
      // Let's keep it if it's there.
      const coords = place.geometry.coordinates; // [lon, lat]
      const distance = getDistanceInKm(
        firstPointCoords[1], firstPointCoords[0],
        coords[1], coords[0]
      );

      // Consider "near" as within 2 km
      if (distance <= 2 && place.id !== firstPoint.id) {
        // Also don't include places that are already in the route?
        // Actually, user might want to see them checked. We can keep them.
        onTheWay.push(place);
      } else {
        other.push(place);
      }
    });

    return { onTheWayPlaces: onTheWay, otherPlaces: other };
  }, [initialPlaces, route]);

  if (initialPlaces.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-12">
      {onTheWayPlaces.length > 0 && (
        <section>
          <div className="mb-6">
            <h2 className="text-headline-sm text-foreground mb-2">Места по пути</h2>
            <p className="text-body-md text-muted-foreground">
              Эти места находятся недалеко от вашей первой выбранной точки.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onTheWayPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      <section>
        {onTheWayPlaces.length > 0 && (
          <h3 className="text-title-lg font-bold text-foreground mb-6 pl-2">Все места</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPlaces.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </div>
  );
}
