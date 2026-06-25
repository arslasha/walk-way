"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Check, Loader2, Lock, Globe, Bookmark } from "lucide-react";
import { useCollectionStore } from "@/store/collectionStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveToCollectionModalProps {
  placeId: number;
  onClose: () => void;
}

export function SaveToCollectionModal({ placeId, onClose }: SaveToCollectionModalProps) {
  const { collections, createCollection, addPlace, removePlace } = useCollectionStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [collectionPlaceIds, setCollectionPlaceIds] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const ids = new Set(
      collections.filter((c) => c.places?.some((p) => p.id === placeId)).map((c) => c.id)
    );
    setCollectionPlaceIds(ids);
  }, [collections, placeId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // document.body.style.overflow = "hidden"; is already handled by PlaceDetailModal if nested, but good to have if opened directly.
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleToggle = async (collectionId: number) => {
    if (pendingIds.has(collectionId)) return;
    setPendingIds((p) => new Set(p).add(collectionId));

    const isInCollection = collectionPlaceIds.has(collectionId);
    let success: boolean;
    if (isInCollection) {
      success = await removePlace(collectionId, placeId);
      if (success) {
        setCollectionPlaceIds((prev) => {
          const next = new Set(prev);
          next.delete(collectionId);
          return next;
        });
      }
    } else {
      success = await addPlace(collectionId, placeId);
      if (success) {
        setCollectionPlaceIds((prev) => new Set(prev).add(collectionId));
      }
    }

    setPendingIds((p) => {
      const next = new Set(p);
      next.delete(collectionId);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const coll = await createCollection(newName.trim(), "", true);
    if (coll) {
      toast.success(`Подборка "${coll.name}" создана`);
      await addPlace(coll.id, placeId);
      setCollectionPlaceIds((prev) => new Set(prev).add(coll.id));
      setNewName("");
      setIsCreating(false);
    }
  };

  if (!mounted) return null;

  const handleRemoveFromAll = async () => {
    const idsToRemove = Array.from(collectionPlaceIds);
    for (const collectionId of idsToRemove) {
      if (!pendingIds.has(collectionId)) {
        setPendingIds((p) => new Set(p).add(collectionId));
        await removePlace(collectionId, placeId);
        setPendingIds((p) => {
          const next = new Set(p);
          next.delete(collectionId);
          return next;
        });
      }
    }
    setCollectionPlaceIds(new Set());
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-background shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
        
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-border bg-surface">
          <h2 className="text-xl font-bold text-foreground">Сохранить в подборку</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-muted-foreground hover:bg-border transition-all active:scale-90"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
          {collections.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-surface-raised flex items-center justify-center mb-4">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold mb-1">У вас пока нет подборок</p>
              <p className="text-sm text-muted-foreground">Создайте первую подборку, чтобы сохранять классные места.</p>
            </div>
          ) : (
            collections.map((c) => {
              const isIn = collectionPlaceIds.has(c.id);
              const isPending = pendingIds.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleToggle(c.id)}
                  disabled={isPending}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all border active:scale-[0.98]",
                    isIn
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-accent/30 hover:bg-surface-raised"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 flex-shrink-0 transition-colors",
                    isIn ? "border-accent bg-accent" : "border-muted-foreground/30 bg-transparent"
                  )}>
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    ) : isIn ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : null}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-foreground truncate">{c.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.is_public ? (
                        <Globe className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {c.is_public ? "Публичная" : "Приватная"} • {c.places?.length || 0} мест
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          <div className="mt-4 pt-4 border-t border-border">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название подборки"
                  autoFocus
                  className="w-full h-12 px-4 rounded-2xl bg-surface border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="h-10 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:bg-surface-raised transition-all active:scale-95"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    className="h-10 px-6 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 transition-all active:scale-95"
                  >
                    Создать
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm font-bold text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 transition-all active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" />
                Новая подборка
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-border bg-surface flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full h-12 rounded-full bg-foreground text-background font-bold text-base hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Готово
          </button>
          {collectionPlaceIds.size > 0 && (
            <button
              onClick={handleRemoveFromAll}
              className="w-full h-12 rounded-full bg-transparent text-muted-foreground font-bold text-base hover:bg-surface-raised transition-all active:scale-[0.98]"
            >
              Не добавлять
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
