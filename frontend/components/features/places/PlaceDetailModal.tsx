"use client";

import { useEffect, useCallback } from "react";
import { X, MapPin, Tag, Plus, Check, Bookmark } from "lucide-react";
import type { PlaceFeature } from "@/types/place";
import { useRouteStore } from "@/store/routeStore";
import { SaveToCollectionButton } from "@/components/collections/SaveToCollectionButton";
import { cn } from "@/lib/utils";
import { ImageWithLoader } from "@/components/ui/ImageWithLoader";

interface PlaceDetailModalProps {
  place: PlaceFeature | null;
  onClose: () => void;
}

export function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  const { route, addPlace, removePlace } = useRouteStore();

  const isInRoute = place ? route.some((r) => r.id === place.id) : false;

  const handleToggleRoute = () => {
    if (!place) return;
    if (isInRoute) {
      removePlace(place.id);
    } else {
      addPlace(place);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!place) return null;

  const p = place.properties;
  const vibes = p.tags?.filter((t) => t.is_vibe) || [];
  const otherTags = p.tags?.filter((t) => !t.is_vibe) || [];
  const [lon, lat] = place.geometry.coordinates;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative z-10 w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-background shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full shrink-0 bg-gradient-to-br from-stone-300 to-stone-400 overflow-hidden">
          {p.photos && p.photos.length > 0 ? (
            <ImageWithLoader
              src={p.photos[0]}
              alt={p.title}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-stone-500 text-sm">
              Нет фото
            </div>
          )}
          {/* Gradient overlay at bottom for title readability */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          {p.category && (
            <span className="absolute left-4 bottom-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
              {p.category.name}
            </span>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Title */}
            <h2 className="text-[22px] font-bold text-foreground leading-tight">
              {p.title}
            </h2>

            {/* Address & Coords */}
            <div className="flex flex-col gap-1.5">
              {p.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                  <span>{p.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70 font-mono pl-6">
                {lat.toFixed(5)}, {lon.toFixed(5)}
              </div>
            </div>

            {/* Description */}
            {p.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            )}

            {/* Vibe Tags */}
            {vibes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Tag className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">Вайбы</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {vibes.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Other Tags */}
            {otherTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {otherTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Icebreakers */}
            {p.icebreakers && p.icebreakers.length > 0 && (
              <div className="rounded-2xl bg-secondary/40 border border-border/60 p-4 space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">
                  Темы для разговора 💬
                </p>
                {p.icebreakers.slice(0, 3).map((ib, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    • {ib}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 border-t border-border bg-background p-4 flex items-center gap-3">
          <SaveToCollectionButton
            placeId={place.id as number}
            className="shrink-0"
          />
          <button
            onClick={handleToggleRoute}
            className={cn(
              "flex flex-1 h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors",
              isInRoute
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
            )}
          >
            {isInRoute ? (
              <>
                <Check className="h-4 w-4" />
                В маршруте
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Добавить в маршрут
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
