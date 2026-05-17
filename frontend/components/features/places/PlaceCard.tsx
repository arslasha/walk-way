"use client";

import type { PlaceFeature } from "@/types/place";
import { useRouteStore } from "@/store/routeStore";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaceCardProps {
  place: PlaceFeature;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const p = place.properties;
  const vibes = p.tags?.filter((t) => t.is_vibe).map((t) => t.name) || [];

  const { route, addPlace, removePlace } = useRouteStore();
  const isInRoute = route.some((r) => r.id === place.id);

  const toggleRoute = () => {
    if (isInRoute) {
      removePlace(place.id);
    } else {
      addPlace(place);
    }
  };

  return (
    <div className={cn(
      "group overflow-hidden rounded-[40px] border bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(15,14,23,0.08)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col relative",
      isInRoute ? "border-accent ring-2 ring-accent/20" : "border-border"
    )}>
      <div className="relative aspect-[3/2] bg-gradient-to-br from-stone-300 to-stone-400 shrink-0">
        {p.photos && p.photos.length > 0 && (
          <img
            src={p.photos[0]}
            alt={p.title}
            className="h-full w-full object-cover"
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
        
        <div className="mb-4 mt-3 flex flex-wrap gap-1.5 mt-auto">
          {vibes.slice(0, 3).map((vibe) => (
            <span key={vibe} className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-accent">
              {vibe}
            </span>
          ))}
          {vibes.length > 3 && (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-medium text-accent">+{vibes.length - 3}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-caption text-muted-foreground">~ 1 ч.</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleRoute();
            }}
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
  );
}
