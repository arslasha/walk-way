"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCollectionStore } from "@/store/collectionStore";
import { toast } from "sonner";
import { SaveToCollectionModal } from "./SaveToCollectionModal";

interface SaveToCollectionButtonProps {
  placeId: number;
  className?: string;
  onModalStateChange?: (isOpen: boolean) => void;
}

export function SaveToCollectionButton({ placeId, className = "", onModalStateChange }: SaveToCollectionButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const { collections, fetchCollections, createCollection, addPlace } = useCollectionStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [collectionPlaceIds, setCollectionPlaceIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const ids = new Set(
      collections.filter((c) => c.places?.some((p) => p.id === placeId)).map((c) => c.id)
    );
    setCollectionPlaceIds(ids);
  }, [collections, placeId]);

  const isSaved = collectionPlaceIds.size > 0;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Войдите, чтобы сохранять места в коллекции");
      return;
    }

    if (isSaved) {
      await fetchCollections();
      setIsModalOpen(true);
      onModalStateChange?.(true);
      return;
    }

    setIsAutoSaving(true);
    try {
      await fetchCollections();
      const currentCollections = useCollectionStore.getState().collections;
      
      let defaultCollection = currentCollections.find(c => c.name.toLowerCase() === "избранное" || c.name.toLowerCase() === "favorites");
      
      if (!defaultCollection) {
        defaultCollection = await createCollection("Избранное", "Мои сохраненные места", false) || undefined;
      }

      if (defaultCollection) {
        const success = await addPlace(defaultCollection.id, placeId);
        if (success) {
          setIsModalOpen(true);
          onModalStateChange?.(true);
        }
      }
    } catch (error) {
      toast.error("Не удалось сохранить место");
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onModalStateChange?.(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isAutoSaving}
        title={isSaved ? "Изменить подборки" : "Сохранить"}
        className={`flex items-center justify-center h-9 w-9 rounded-full border transition-all flex-shrink-0 ${
          isSaved
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-surface/80 text-muted-foreground hover:text-accent hover:border-accent/50"
        } ${className}`}
      >
        {isAutoSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-accent" : ""}`} />
        )}
      </button>

      {isModalOpen && (
        <SaveToCollectionModal
          placeId={placeId}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
