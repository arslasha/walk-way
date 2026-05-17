import { PlaceCard } from "@/components/features/places/PlaceCard";
import { LocationFilter } from "@/components/features/places/LocationFilter";
import { getPlaces, getTags } from "@/lib/api";
import Link from "next/link";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await searchParams in Next.js 15+ (safe to do even in 14 depending on setup)
  const resolvedParams = await searchParams;
  const currentTags = typeof resolvedParams.tags === "string" ? resolvedParams.tags.split(",") : [];
  
  const places = await getPlaces({
    tags: resolvedParams.tags as string,
    category: resolvedParams.category as string,
    lat: resolvedParams.lat ? parseFloat(resolvedParams.lat as string) : undefined,
    lon: resolvedParams.lon ? parseFloat(resolvedParams.lon as string) : undefined,
    radius: resolvedParams.radius ? parseFloat(resolvedParams.radius as string) : undefined,
  });

  const allVibes = await getTags(true);

  return (
    <div className="pt-24 pb-32">
      <div className="ww-container">
        {/* Header / Title */}
        <div className="mb-8">
          <h1 className="text-headline-xl text-foreground mb-4">
            исследуй
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl">
            Листайте подборку и находите новые места. Свайпайте теги, чтобы изменить настроение.
          </p>
        </div>

        {/* Filter Row */}
        <div className="mb-12 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex flex-nowrap items-center gap-2">
            <Link
              href="/explore"
              className={`chip whitespace-nowrap ${currentTags.length === 0 ? "chip-active" : ""}`}
            >
              все вайбы
            </Link>
            
            <div className="w-px h-6 bg-border mx-2 shrink-0" />
            
            <LocationFilter />
            
            <div className="w-px h-6 bg-border mx-2 shrink-0" />

            {allVibes.map(vibe => {
              const isActive = currentTags.includes(vibe.slug);
              // Toggle logic: if active, remove it. If not, add it.
              const newTags = isActive 
                ? currentTags.filter(t => t !== vibe.slug)
                : [...currentTags, vibe.slug];
              
              // We want to preserve other query parameters
              const params = new URLSearchParams();
              if (newTags.length > 0) params.set("tags", newTags.join(","));
              if (resolvedParams.category) params.set("category", resolvedParams.category as string);
              if (resolvedParams.lat) params.set("lat", resolvedParams.lat as string);
              if (resolvedParams.lon) params.set("lon", resolvedParams.lon as string);
              if (resolvedParams.radius) params.set("radius", resolvedParams.radius as string);
              
              const queryStr = params.toString();
              const href = queryStr ? `/explore?${queryStr}` : "/explore";
              
              return (
                <Link
                  key={vibe.id}
                  href={href}
                  className={`chip whitespace-nowrap ${isActive ? "chip-active" : ""}`}
                >
                  {vibe.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Explore Feed: 2-col editorial grid */}
        {!places || places.features.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-body-lg text-muted-foreground">Ничего не найдено. Попробуйте изменить фильтры.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.features.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
