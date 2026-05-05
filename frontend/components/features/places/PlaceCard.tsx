import type { Place } from "@/types/place";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-80 bg-gradient-to-br from-stone-300 to-stone-400">
        <span className="absolute left-4 top-4 rounded-full bg-ww-orange px-3 py-1 text-label-caps text-white">
          {place.category}
        </span>
      </div>
      <div className="p-5">
        <p className="mb-1 text-label-caps text-muted-foreground">
          {place.category} · Москва
        </p>
        <h3 className="mb-1 text-xl font-bold text-foreground">{place.name}</h3>
        <p className="mb-3 text-sm text-muted-foreground">{place.address}</p>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {place.vibes.map((vibe) => (
            <span key={vibe} className="chip py-0.5 px-2.5 text-xs">
              {vibe}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">{place.duration}</span>
          <a
            href={`/place/${place.slug}`}
            className="text-sm font-medium text-foreground transition-colors hover:text-accent"
          >
            подробнее →
          </a>
        </div>
      </div>
    </div>
  );
}
