import { PlaceCardSkeleton } from "@/components/ui/Skeletons";

export default function ExploreLoading() {
  return (
    <div className="pt-24 pb-32">
      <div className="ww-container">
        {/* Header / Title Skeleton */}
        <div className="mb-8">
          <div className="h-16 w-64 rounded-full bg-border/40 animate-pulse mb-4" />
          <div className="h-6 w-full max-w-xl rounded-full bg-border/40 animate-pulse" />
          <div className="h-6 w-3/4 max-w-md rounded-full bg-border/40 animate-pulse mt-2" />
        </div>

        {/* Filter Row Skeleton */}
        <div className="mb-12 flex items-center gap-2 overflow-hidden pb-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 rounded-full bg-border/40 animate-pulse shrink-0"
            />
          ))}
        </div>

        {/* Explore Feed Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <PlaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
