"use client";

import { useState } from "react";
import type { PlaceFeature } from "@/types/place";
import { useRouteStore } from "@/store/routeStore";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveToCollectionButton } from "@/components/collections/SaveToCollectionButton";
import { PlaceDetailModal } from "./PlaceDetailModal";
import { ImageWithLoader } from "@/components/ui/ImageWithLoader";

interface PlaceCardProps {
  place: PlaceFeature;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const p = place.properties;
  const vibes = p.tags?.filter((t) => t.is_vibe).map((t) => t.name) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { route, addPlace, removePlace } = useRouteStore();
  const isInRoute = route.some((r) => r.id === place.id);

  const toggleRoute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInRoute) {
      removePlace(place.id);
    } else {
      addPlace(place);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "group overflow-hidden rounded-[40px] border bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(15,14,23,0.08)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col relative cursor-pointer",
          isInRoute ? "border-accent ring-2 ring-accent/20" : "border-border"
        )}
      >
        <div className="relative aspect-[3/2] bg-gradient-to-br from-stone-300 to-stone-400 shrink-0">
          {p.photos && p.photos.length > 0 && (
            <ImageWithLoader
              src={p.photos[0]}
              alt={p.title}
            />
          )}
          {p.category && (
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              {p.category.name}
            </span>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-[18px] font-bold text-foreground line-clamp-2">{p.title}</h3>
          <p className="mt-1 text-caption text-muted-foreground line-clamp-2">{p.address || "Адрес не указан"}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {vibes.slice(0, 3).map((vibe) => (
              <span key={vibe} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-accent">
                {vibe}
              </span>
            ))}
            {vibes.length > 3 && (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-accent">+{vibes.length - 3}</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 gap-2">
            <span className="text-caption text-muted-foreground">~ 1 ч.</span>
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bookmark — save to personal collection */}
              <SaveToCollectionButton placeId={place.id as number} />
              <button
                onClick={toggleRoute}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors",
                  isInRoute
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isInRoute ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>В маршруте</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>В маршрут</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <PlaceDetailModal place={place} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
