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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [pointerStartY, setPointerStartY] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setIsCollapsed(window.innerWidth < 768);
    }
  }, []);

  // Auto-expand when a new place is added
  useEffect(() => {
    if (route.length > 0) {
      setIsCollapsed(false);
    }
  }, [route.length]);

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

  const handlePointerDown = (e: React.PointerEvent) => {
    setPointerStartY(e.clientY);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartY === null) return;
    const deltaY = e.clientY - pointerStartY;
    
    if (Math.abs(deltaY) > 10) {
      if (deltaY < 0 && isCollapsed) setIsCollapsed(false);
      else if (deltaY > 0 && !isCollapsed) setIsCollapsed(true);
    } else {
      setIsCollapsed(!isCollapsed);
    }
    setPointerStartY(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
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
    <div className="py-1">
      {route.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
            <Compass className="h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
          <h4 className="text-body-md font-bold text-foreground mb-1">Маршрут пуст</h4>
          <p className="text-xs text-muted-foreground max-w-xs">
            Добавьте места или воспользуйтесь рекомендациями.
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
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Быстрое добавление
        </h4>
        {selectedCategory && (
          <button 
            onClick={() => setSelectedCategory(null)}
            className="text-[11px] text-accent hover:underline font-semibold active:opacity-70 transition-opacity"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Category Horizontal list */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 shrink-0">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shrink-0 active:scale-95",
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
      <div className="space-y-2 min-h-[90px]">
        {isFetchingAlongRoute ? (
          <div className="flex flex-col items-center justify-center py-4">
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
          filteredRecommendations.slice(0, 10).map((place) => (
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
                className="px-2.5 py-1 rounded-full bg-secondary text-accent text-[10px] font-bold hover:bg-accent hover:text-white transition-all shrink-0 active:scale-90"
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
    <div className={cn(
      "fixed z-30 flex flex-col bg-background/95 backdrop-blur-md border border-border shadow-2xl overflow-hidden pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] select-none",
      isCollapsed
        ? "left-4 right-4 bottom-4 h-[146px] rounded-[32px]" 
        : "left-4 right-4 top-[88px] bottom-4 rounded-[40px]",
      "md:left-6 md:right-auto md:w-96 md:top-[96px] md:bottom-6 md:h-auto md:rounded-[40px]"
    )}>
      <div className={cn(
        "flex flex-col h-full overflow-hidden",
        isCollapsed ? "p-4" : "p-5"
      )}>
        {/* Mobile Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="flex md:hidden justify-center py-2 -mt-2 mb-2 cursor-grab active:cursor-grabbing touch-none"
          aria-label={isCollapsed ? "Развернуть маршрут" : "Свернуть маршрут"}
        >
          <div className="w-12 h-1.5 bg-border rounded-full hover:bg-muted-foreground/30 transition-colors" />
        </div>

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
          <div className="flex items-center gap-3">
            {route.length > 0 && !isCollapsed && (
              <button
                onClick={() => {
                  if (window.confirm("Вы уверены, что хотите полностью очистить маршрут?")) {
                    clearRoute();
                    toast.success("Маршрут очищен");
                  }
                }}
                className="p-1.5 text-muted-foreground hover:text-error transition-all rounded-full hover:bg-secondary active:scale-90"
                title="Очистить маршрут"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
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

        {/* Collapsible Content wrapper */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 transition-all duration-500",
          isCollapsed ? "opacity-0 pointer-events-none hidden md:flex" : "opacity-100"
        )}>
          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
            {/* Route Type & Settings */}
            <div className="mb-3 shrink-0 space-y-2">
              <div className="flex bg-secondary/40 p-1 rounded-2xl border border-border/40">
                <button
                  onClick={() => setLoopMode(false)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all active:scale-[0.98]",
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
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-xl transition-all active:scale-[0.98]",
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
                        "px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 active:scale-95",
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
            <div className="mt-2 pt-3 border-t border-border/80 flex flex-col shrink-0">
              <div className="relative mb-2 shrink-0">
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
          </div>

          {/* Primary CTA Action (Pinned to Bottom) */}
          <div className="pt-2 border-t border-border/80 shrink-0">
            <button
              onClick={handleStartRoute}
              className="w-full h-11 rounded-full bg-accent text-white text-[13px] font-bold hover:bg-accent-hover transition-all shadow-lg shadow-accent/15 active:scale-[0.98] active:bg-accent/90"
            >
              Начать маршрут
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
