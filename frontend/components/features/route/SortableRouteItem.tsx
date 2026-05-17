import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { PlaceFeature } from '@/types/place';

interface SortableRouteItemProps {
  place: PlaceFeature;
  index: number;
  onRemove: (id: number) => void;
}

export function SortableRouteItem({ place, index, onRemove }: SortableRouteItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center gap-2 rounded-2xl border ${isDragging ? 'border-primary shadow-md' : 'border-border'} p-2 bg-card`}
    >
      <button 
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-accent text-[13px] font-bold">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-[15px] font-bold truncate text-foreground">{place.properties.title}</h4>
        <p className="text-[13px] text-muted-foreground truncate">{place.properties.address}</p>
      </div>
      
      <button 
        onClick={() => onRemove(place.id)}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
