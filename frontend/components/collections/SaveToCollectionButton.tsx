"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bookmark, Plus, Check, Loader2, Lock, Globe } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCollectionStore } from "@/store/collectionStore";
import { toast } from "sonner";
import Link from "next/link";

interface SaveToCollectionButtonProps {
  placeId: number;
  className?: string;
}

export function SaveToCollectionButton({ placeId, className = "" }: SaveToCollectionButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { collections, fetchCollections, createCollection, addPlace, removePlace } =
    useCollectionStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [collectionPlaceIds, setCollectionPlaceIds] = useState<Set<number>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Figure out which collections contain this place
  useEffect(() => {
    const ids = new Set(
      collections.filter((c) => c.places?.some((p) => p.id === placeId)).map((c) => c.id)
    );
    setCollectionPlaceIds(ids);
  }, [collections, placeId]);

  // Fetch detailed collections when opening (to get places array)
  const handleOpen = async () => {
    if (!isAuthenticated) {
      toast.info("Войдите, чтобы сохранять места в коллекции");
      return;
    }
    await fetchCollections();
    setIsOpen(true);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName("");
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

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
        toast.success("Место удалено из коллекции");
      }
    } else {
      success = await addPlace(collectionId, placeId);
      if (success) {
        setCollectionPlaceIds((prev) => new Set(prev).add(collectionId));
        toast.success("Место добавлено в коллекцию");
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
      toast.success(`Коллекция "${coll.name}" создана`);
      // Auto-add this place to the new collection
      await addPlace(coll.id, placeId);
      setCollectionPlaceIds((prev) => new Set(prev).add(coll.id));
      setNewName("");
      setIsCreating(false);
    }
  };

  const isSaved = collectionPlaceIds.size > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={handleOpen}
        title="Сохранить в коллекцию"
        className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all ${
          isSaved
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-surface/80 text-muted-foreground hover:text-accent hover:border-accent/50"
        }`}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-accent" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-[20px] border border-border bg-surface shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Сохранить в папку
            </p>
          </div>

          <div className="max-h-48 overflow-y-auto px-2 py-1">
            {collections.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                У вас пока нет коллекций
              </p>
            ) : (
              collections.map((c) => {
                const isIn = collectionPlaceIds.has(c.id);
                const isPending = pendingIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleToggle(c.id)}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-sm hover:bg-surface-raised transition-colors"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border flex-shrink-0">
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      ) : isIn ? (
                        <Check className="h-3 w-3 text-accent" />
                      ) : null}
                    </span>
                    <span className="flex-1 text-left truncate text-foreground font-medium">
                      {c.name}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      {c.is_public ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-3 py-2">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Название папки"
                  autoFocus
                  className="flex-1 h-8 px-3 rounded-full text-xs bg-surface-raised border border-border focus:border-accent focus:outline-none text-foreground"
                />
                <button
                  type="submit"
                  className="h-8 px-3 rounded-full bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-all flex-shrink-0"
                >
                  ок
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Создать новую папку
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
