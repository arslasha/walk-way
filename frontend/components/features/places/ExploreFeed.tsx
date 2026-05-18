"use client";

import React, { useMemo } from "react";
import { PlaceFeature } from "@/types/place";
import { PlaceCard } from "./PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouteStore } from "@/store/routeStore";

interface ExploreFeedProps {
  initialPlaces: PlaceFeature[];
}

export function ExploreFeed({ initialPlaces }: ExploreFeedProps) {
  const { route, alongRoutePlaces, isFetchingAlongRoute } = useRouteStore();

  const otherPlaces = useMemo(() => {
    if (alongRoutePlaces.length === 0) {
      return initialPlaces;
    }
    const alongRouteIds = new Set(alongRoutePlaces.map((p) => p.id));
    return initialPlaces.filter((place) => !alongRouteIds.has(place.id));
  }, [initialPlaces, alongRoutePlaces]);

  if (initialPlaces.length === 0) {
    return <EmptyState />;
  }

  const showAlongRoute = route.length > 0 && (isFetchingAlongRoute || alongRoutePlaces.length > 0);

  return (
    <div className="space-y-12">
      {showAlongRoute && (
        <section>
          <div className="mb-6">
            <h2 className="text-headline-sm text-foreground mb-2">Места по пути</h2>
            <p className="text-body-md text-muted-foreground">
              Интересные места по пути вашего прогулочного маршрута.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isFetchingAlongRoute ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="h-[320px] rounded-[40px] bg-secondary/30 animate-pulse border border-border/50 flex flex-col p-6 justify-end space-y-3"
                >
                  <div className="h-6 bg-secondary/50 rounded-full w-2/3"></div>
                  <div className="h-4 bg-secondary/50 rounded-full w-1/2"></div>
                </div>
              ))
            ) : (
              alongRoutePlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))
            )}
          </div>
        </section>
      )}

      <section>
        {alongRoutePlaces.length > 0 && (
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
