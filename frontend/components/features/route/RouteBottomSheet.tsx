"use client";

import { useState, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import { 
  Trash2, 
  Search, 
  Sparkles, 
  Compass, 
  Coffee, 
  Palmtree, 
  Building2,
  Loader2,
  Route as RouteIcon,
  Repeat
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PlaceFeature } from "@/types/place";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableRouteItem } from "./SortableRouteItem";

interface RouteBottomSheetProps {
  onSelectPlace: (place: PlaceFeature) => void;
  activePlaceId: number | null;
}

export function RouteBottomSheet({ onSelectPlace, activePlaceId }: RouteBottomSheetProps) {
  const { 
    route, 
    removePlace, 
    reorderPlaces, 
    addPlace, 
    clearRoute,
    distance,
    duration,
    steps,
    alongRoutePlaces,
    isCalculatingRoute,
    isFetchingAlongRoute,
    isLoopRoute,
    loopDurationMinutes,
    setLoopMode
  } = useRouteStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const formatDuration = (mins: number) => {
    if (mins === 0) return "—";
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours} ч ${remainingMins} мин` : `${hours} ч`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = route.findIndex((p) => p.id.toString() === active.id);
      const newIndex = route.findIndex((p) => p.id.toString() === over.id);
      reorderPlaces(arrayMove(route, oldIndex, newIndex));
    }
  };

  const handleStartRoute = () => {
    if (route.length === 0) {
      toast.error("Сначала добавьте точки в маршрут!");
      return;
    }
    toast.success("Маршрут успешно запущен!", {
      description: `Расстояние: ${distance} км, примерное время: ${formatDuration(duration)}. Приятной прогулки!`,
      duration: 5000,
    });
  };

  // Filter recommendations based on category click and search input
  const filteredRecommendations = alongRoutePlaces.filter((place) => {
    const matchesSearch = place.properties.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.properties.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory 
      ? place.properties.category?.slug === selectedCategory
      : true;
      
    const notAlreadyInRoute = !route.some((p) => p.id === place.id);

    return matchesSearch && matchesCategory && notAlreadyInRoute;
  });

  const categoriesList = [
    { name: "Кафе", slug: "cafe", icon: Coffee },
    { name: "Парки", slug: "park", icon: Palmtree },
    { name: "Музеи", slug: "museum", icon: Building2 },
    { name: "Бары", slug: "bar", icon: Sparkles },
  ];

  // Helper to render the draggable points list
  const renderPointsList = () => (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-2">
      {route.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
            <Compass className="h-7 w-7 text-muted-foreground animate-pulse" />
          </div>
          <h4 className="text-body-md font-bold text-foreground mb-1">Маршрут пуст</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Добавьте места на вкладке «Исследовать» или воспользуйтесь рекомендациями ниже.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={route.map((p) => p.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 px-1">
              {route.map((place, index) => (
                <SortableRouteItem
                  key={place.id}
                  place={place}
                  index={index}
                  onRemove={removePlace}
                  onClick={onSelectPlace}
                  isActive={activePlaceId === place.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );

  // Helper to render Quick Add search & recommended grid
  const renderQuickAdd = () => (
    <div className="mt-4 border-t border-border/80 pt-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Быстрое добавление
        </h4>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-[11px] text-accent hover:underline font-semibold"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Category Horizontal list */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shrink-0",
                isSelected
                  ? "bg-accent border-accent text-white shadow-sm"
                  : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
              )}
            >
              <Icon className="h-3 w-3" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Filtered quick recommendations */}
      <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2 mt-1">
        {isFetchingAlongRoute ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-accent mb-2" />
            <p className="text-[10px] text-muted-foreground">Ищем интересные места по пути...</p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-3 text-center">
            {route.length === 0 
              ? "Добавьте первую точку, чтобы увидеть рекомендации по пути!"
              : "Все места добавлены или ничего не найдено."}
          </p>
        ) : (
          filteredRecommendations.map((place) => (
            <div 
              key={place.id} 
              className="flex items-center justify-between p-2.5 rounded-2xl border border-border bg-surface hover:border-accent/30 transition-all"
            >
              <div className="min-w-0 flex-1 pr-2">
                <h5 className="text-xs font-bold text-foreground truncate">{place.properties.title}</h5>
                <p className="text-[10px] text-muted-foreground truncate">{place.properties.address}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  addPlace(place);
                  toast.success(`Добавлено: ${place.properties.title}`);
                }}
                className="px-2.5 py-1 rounded-full bg-secondary text-accent text-[10px] font-bold hover:bg-accent hover:text-white transition-all shrink-0"
              >
                +
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed left-4 right-4 md:left-6 md:right-auto md:w-96 top-[88px] md:top-[96px] bottom-4 md:bottom-6 z-30 flex flex-col bg-background/95 backdrop-blur-md border border-border rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto">
      <div className="p-5 flex flex-col h-full overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-body-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <span>Ваш маршрут</span>
            {route.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-accent text-[11px] font-extrabold">
                {route.length}
              </span>
            )}
          </h3>
          {route.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Вы уверены, что хотите полностью очистить маршрут?")) {
                  clearRoute();
                  toast.success("Маршрут очищен");
                }
              }}
              className="p-1.5 text-muted-foreground hover:text-error transition-colors rounded-full hover:bg-secondary"
              title="Очистить маршрут"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Metrics display */}
        <div className="grid grid-cols-3 gap-1.5 p-2.5 bg-secondary/40 rounded-3xl mb-3 shrink-0 text-center border border-border/40 relative overflow-hidden">
          {isCalculatingRoute && (
            <div className="absolute right-3 top-3 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
            </div>
          )}
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold">Время</div>
            <div className="text-xs font-bold text-foreground tracking-tight mt-0.5">
              {formatDuration(duration)}
            </div>
          </div>
          <div className="border-x border-border/50">
            <div className="text-[10px] text-muted-foreground font-semibold">Длина</div>
            <div className="text-xs font-bold text-foreground tracking-tight mt-0.5">
              {distance} км
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold">Шаги</div>
            <div className="text-xs font-bold text-foreground tracking-tight mt-0.5">
              {steps.toLocaleString("ru-RU")}
            </div>
          </div>
        </div>

        {/* Route Type & Settings */}
        <div className="mb-3 shrink-0 space-y-2">
          <div className="flex bg-secondary/40 p-1 rounded-2xl border border-border/40">
            <button
              onClick={() => setLoopMode(false)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all",
                !isLoopRoute 
                  ? "bg-surface shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <RouteIcon className="w-3.5 h-3.5" />
              Обычный
            </button>
            <button
              onClick={() => setLoopMode(true)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all",
                isLoopRoute 
                  ? "bg-surface shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Repeat className="w-3.5 h-3.5" />
              Круговой
            </button>
          </div>
          
          {isLoopRoute && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[30, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setLoopMode(true, mins)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0",
                    loopDurationMinutes === mins
                      ? "bg-accent border-accent text-white shadow-sm"
                      : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
                  )}
                >
                  {mins === 30 ? "30 мин" : mins === 60 ? "1 час" : mins === 90 ? "1.5 часа" : "2 часа"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Draggable points list */}
        {renderPointsList()}

        {/* Quick Add and Search section */}
        <div className="mt-3 shrink-0">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск мест для быстрого добавления..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-full border border-border bg-surface text-[11px] placeholder-muted-foreground focus:outline-none focus:border-accent transition-all"
            />
          </div>

          {renderQuickAdd()}
        </div>

        {/* Primary CTA Action */}
        <div className="mt-3 pt-3 border-t border-border/80 shrink-0">
          <button
            onClick={handleStartRoute}
            className="w-full h-11 rounded-full bg-accent text-white text-[13px] font-bold hover:bg-accent-hover transition-colors shadow-lg shadow-accent/15"
          >
            Начать маршрут
          </button>
        </div>
      </div>
    </div>
  );
}
