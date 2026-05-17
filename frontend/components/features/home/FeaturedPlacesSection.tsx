import { PlaceCard } from "@/components/features/places/PlaceCard";
import { PlaceCardSmall } from "@/components/features/places/PlaceCardSmall";
import { getPlaces } from "@/lib/api";

export async function FeaturedPlacesSection() {
  let featuredPlaces: any[] = [];
  try {
    const data = await getPlaces();
    featuredPlaces = data.features.slice(0, 3);
  } catch (error) {
    console.error("Failed to fetch featured places:", error);
    // Fallback or empty state could be handled here
  }

  const mainPlace = featuredPlaces[0];
  const sidePlaces = featuredPlaces.slice(1, 3);

  return (
    <section className="ww-container pb-20">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-headline-lg text-foreground">сейчас в топе</h2>
        <a
          href="/explore"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          все места →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]">
        {mainPlace ? (
          <PlaceCard place={mainPlace} />
        ) : (
          <div className="h-80 rounded-[40px] bg-card border border-border flex items-center justify-center text-muted-foreground">
            Нет доступных мест
          </div>
        )}
        <div className="flex flex-col gap-4">
          {sidePlaces.map((place) => (
            <PlaceCardSmall key={place.id} place={place} />
          ))}
        </div>
      </div>
    </section>
  );
}
