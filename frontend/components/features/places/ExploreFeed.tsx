"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { PlaceFeature, PlaceFilters } from "@/types/place";
import { PlaceCard } from "./PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { useRouteStore } from "@/store/routeStore";
import { getPlaces } from "@/lib/api";

interface ExploreFeedProps {
  initialPlaces: PlaceFeature[];
  initialHasNextPage: boolean;
  filters: PlaceFilters;
}

export function ExploreFeed({ initialPlaces, initialHasNextPage, filters }: ExploreFeedProps) {
  const { route, alongRoutePlaces, isFetchingAlongRoute } = useRouteStore();

  const [places, setPlaces] = useState<PlaceFeature[]>(initialPlaces);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset state when filters or initial data change
  useEffect(() => {
    setPlaces(initialPlaces);
    setPage(1);
    setHasNextPage(initialHasNextPage);
  }, [initialPlaces, initialHasNextPage, filters]);

  // Infinite Scroll logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => observer.disconnect();
  }, [hasNextPage, isLoadingMore, page, filters]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getPlaces({ ...filters, page: nextPage });
      
      // Ensure we don't add duplicates
      setPlaces((prev) => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUniquePlaces = data.features.filter(p => !existingIds.has(p.id));
        return [...prev, ...newUniquePlaces];
      });
      
      setPage(nextPage);
      setHasNextPage(!!data.next);
    } catch (error) {
      console.error("Failed to load more places:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleUpdatePlace = (updatedPlace: PlaceFeature) => {
    setPlaces((prev) => prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p)));
  };

  const handleDeletePlace = (id: number) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const otherPlaces = useMemo(() => {
    if (alongRoutePlaces.length === 0) {
      return places;
    }
    const alongRouteIds = new Set(alongRoutePlaces.map((p) => p.id));
    return places.filter((place) => !alongRouteIds.has(place.id));
  }, [places, alongRoutePlaces]);

  if (places.length === 0 && !isLoadingMore) {
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
          {isFetchingAlongRoute ? (
            <Loader
              message="Ищем интересные места по пути..."
              className="py-16"
              size="md"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alongRoutePlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onUpdate={handleUpdatePlace}
                  onDelete={handleDeletePlace}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        {alongRoutePlaces.length > 0 && (
          <h3 className="text-title-lg font-bold text-foreground mb-6 pl-2">Все места</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onUpdate={handleUpdatePlace}
              onDelete={handleDeletePlace}
            />
          ))}
        </div>
        
        {/* Loading indicator & intersection observer target */}
        <div ref={observerTarget} className="mt-8 flex justify-center pb-8">
          {isLoadingMore && <Loader message="Загружаем еще..." size="sm" />}
        </div>
      </section>
    </div>
  );
}
