"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Loader2, Sparkles, Tag as TagIcon, Check } from "lucide-react";
import type { PlaceFeature, Category, Tag } from "@/types/place";
import { getTags, getCategories, updatePlace } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditPlaceModalProps {
  place: PlaceFeature;
  onClose: () => void;
  onUpdate: (updatedPlace: PlaceFeature) => void;
}

export function EditPlaceModal({ place, onClose, onUpdate }: EditPlaceModalProps) {
  const [description, setDescription] = useState(place.properties.description || "");
  const [categoryId, setCategoryId] = useState<number>(place.properties.category?.id || 0);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    place.properties.tags?.map((t) => t.id) || []
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cats, tags] = await Promise.all([
          getCategories(),
          getTags(), // fetch all tags (vibes + regular)
        ]);
        setCategories(cats);
        setAllTags(tags);
      } catch (err) {
        console.error("Failed to load metadata for edit form", err);
        toast.error("Не удалось загрузить категории и теги");
      } finally {
        setLoadingMetadata(false);
      }
    }
    loadMetadata();
  }, []);

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

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const updated = await updatePlace(place.id, {
        description,
        category_id: categoryId,
        tag_ids: selectedTagIds,
      });

      if (updated) {
        toast.success("Место успешно обновлено!");
        onUpdate(updated);
        onClose();
      } else {
        toast.error("Не удалось сохранить изменения");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const vibes = allTags.filter((t) => t.is_vibe);
  const normalTags = allTags.filter((t) => !t.is_vibe);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-background border border-border shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h3 className="text-title-lg font-extrabold text-foreground">Редактирование</h3>
            <p className="text-caption text-muted-foreground mt-1 line-clamp-1">{place.properties.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        {loadingMetadata ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground text-sm">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            Загрузка настроек места...
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {/* Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Описание места
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите об этом месте, его фишках и атмосфере..."
                className="w-full h-32 px-4 py-3 rounded-2xl border border-border bg-surface text-sm focus:outline-none focus:border-accent text-foreground resize-none leading-relaxed transition-all"
                required
              />
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Категория
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-sm focus:outline-none focus:border-accent text-foreground appearance-none cursor-pointer transition-all"
                >
                  <option value={0}>Выберите категорию...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 border-l border-border pl-3 flex items-center">
                  <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground rotate-45" />
                </div>
              </div>
            </div>

            {/* Vibes Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Вайбы / Настроение
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {vibes.map((vibe) => {
                  const isSelected = selectedTagIds.includes(vibe.id);
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => handleToggleTag(vibe.id)}
                      className={cn(
                        "chip transition-all flex items-center gap-1 active:scale-95",
                        isSelected ? "chip-active" : "bg-secondary hover:border-accent/30 text-foreground"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-0.5 shrink-0" />}
                      {vibe.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Regular Tags Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Теги / Характеристики
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto no-scrollbar p-1 border border-border/40 rounded-2xl bg-surface/30">
                {normalTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={cn(
                        "chip transition-all flex items-center gap-1 active:scale-95",
                        isSelected ? "chip-active" : "bg-secondary/60 hover:border-accent/30 text-foreground text-xs"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-0.5 shrink-0" />}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 h-11 rounded-full text-xs font-bold text-muted-foreground hover:bg-secondary transition-all active:scale-[0.98]"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 h-11 rounded-full text-xs font-bold bg-accent text-white hover:bg-accent-hover transition-all shadow-md shadow-accent/10 active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Сохранить
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
