"use client";

import { useState } from "react";
import type { PlaceFeature } from "@/types/place";
import { useRouteStore } from "@/store/routeStore";
import { useAuthStore } from "@/store/authStore";
import { Plus, Check, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SaveToCollectionButton } from "@/components/collections/SaveToCollectionButton";
import { PlaceDetailModal } from "./PlaceDetailModal";
import { EditPlaceModal } from "./EditPlaceModal";
import { ImageWithLoader } from "@/components/ui/ImageWithLoader";
import { deletePlace } from "@/lib/api";
import { toast } from "sonner";

interface PlaceCardProps {
  place: PlaceFeature;
  onUpdate?: (updatedPlace: PlaceFeature) => void;
  onDelete?: (id: number) => void;
}

export function PlaceCard({ place, onUpdate, onDelete }: PlaceCardProps) {
  const p = place.properties;
  const vibes = p.tags?.filter((t) => t.is_vibe).map((t) => t.name) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { user } = useAuthStore();
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

  const handlePlaceUpdate = (updatedPlace: PlaceFeature) => {
    if (onUpdate) onUpdate(updatedPlace);
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={cn(
          "group overflow-hidden rounded-[40px] border bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(15,14,23,0.08)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col relative cursor-pointer active:scale-[0.98]",
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
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bookmark — save to personal collection */}
              <SaveToCollectionButton placeId={place.id as number} />
              
              {/* Admin Actions */}
              {user?.is_staff && (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all active:scale-90"
                    title="Редактировать"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Вы уверены, что хотите удалить место "${p.title}"?`)) {
                        try {
                          const ok = await deletePlace(place.id);
                          if (ok) {
                            toast.success("Место удалено");
                            // Remove from active route too
                            removePlace(place.id);
                            onDelete?.(place.id);
                          } else {
                            toast.error("Не удалось удалить место");
                          }
                        } catch (err) {
                          toast.error("Ошибка при удалении");
                        }
                      }
                    }}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}

              <button
                onClick={toggleRoute}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-all active:scale-[0.98]",
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

      {isEditOpen && (
        <EditPlaceModal
          place={place}
          onClose={() => setIsEditOpen(false)}
          onUpdate={handlePlaceUpdate}
        />
      )}
    </>
  );
}
