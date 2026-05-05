import type { Place } from "@/types/place";

interface PlaceCardSmallProps {
  place: Place;
}

export function PlaceCardSmall({ place }: PlaceCardSmallProps) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-36 bg-gradient-to-br from-stone-200 to-stone-300">
        <span className="absolute left-4 top-4 rounded-full bg-ww-orange px-3 py-1 text-label-caps text-white">
          {place.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="mb-0.5 text-base font-bold text-foreground">{place.name}</h3>
        <p className="mb-2 text-xs text-muted-foreground">{place.address}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{place.duration}</span>
          <a
            href={`/place/${place.slug}`}
            className="text-xs font-medium text-foreground transition-colors hover:text-accent"
          >
            подробнее →
          </a>
        </div>
      </div>
    </div>
  );
}
