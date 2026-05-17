"use client";

import { useState, useEffect } from "react";
import { useRouteStore } from "@/store/routeStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Map, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { SortableRouteItem } from "./SortableRouteItem";

export function RouteDrawer() {
  const { route, removePlace, reorderPlaces } = useRouteStore();
  const [isMounted, setIsMounted] = useState(false);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = route.findIndex((p) => p.id.toString() === active.id);
      const newIndex = route.findIndex((p) => p.id.toString() === over.id);
      reorderPlaces(arrayMove(route, oldIndex, newIndex));
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Map FAB */}
      <Link 
        href="/map" 
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
      >
        <Map className="h-6 w-6" />
      </Link>

      {/* Route Drawer Trigger - Only show if route has items */}
      {route.length > 0 && (
      <Sheet>
        <SheetTrigger className="flex h-12 items-center gap-2 rounded-full bg-foreground px-4 text-background shadow-lg hover:scale-105 transition-transform">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground text-[13px] font-bold">
              {route.length}
            </span>
            <span className="font-bold text-[14px]">Маршрут</span>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-md p-6">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-headline-sm font-bold text-foreground">Ваш маршрут</SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
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
                <div className="space-y-3">
                  {route.map((place, index) => (
                    <SortableRouteItem 
                      key={place.id} 
                      place={place} 
                      index={index} 
                      onRemove={removePlace} 
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="pt-4 border-t border-border mt-auto">
            <Link 
              href="/map" 
              className="flex w-full h-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-[15px] font-bold hover:bg-primary/90 transition-colors"
            >
              Перейти к карте
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      )}
    </div>
  );
}
