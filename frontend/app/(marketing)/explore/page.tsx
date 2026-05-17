import { LocationFilter } from "@/components/features/places/LocationFilter";
import { ExploreFeed } from "@/components/features/places/ExploreFeed";
import { RouteDrawer } from "@/components/features/route/RouteDrawer";
import { DraggableScrollContainer } from "@/components/ui/DraggableScrollContainer";
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
        <DraggableScrollContainer className="mb-12 pb-4">
          <div className="flex flex-nowrap items-center gap-2">
            <Link
              href="/explore"
              className={`chip whitespace-nowrap ${currentTags.length === 0 ? "chip-active" : ""}`}
              draggable={false}
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
                  draggable={false}
                >
                  {vibe.name}
                </Link>
              );
            })}
          </div>
        </DraggableScrollContainer>

        {/* Explore Feed: 2-col editorial grid */}
        <ExploreFeed initialPlaces={places?.features || []} />
      </div>
      
      <RouteDrawer />
    </div>
  );
}
