export function PlaceCardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[3/2] w-full rounded-[40px] bg-border/40 animate-pulse" />
      <div className="px-2">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 w-1/3 rounded-full bg-border/40 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-border/40 animate-pulse" />
        </div>
        <div className="h-4 w-2/3 rounded-full bg-border/40 animate-pulse" />
      </div>
    </div>
  );
}

export function PlaceCardSmallSkeleton() {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-border bg-card h-full flex flex-col">
      <div className="aspect-[3/2] w-full bg-border/40 animate-pulse shrink-0" />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="h-5 w-3/4 rounded-full bg-border/40 animate-pulse" />
        <div className="h-4 w-1/2 rounded-full bg-border/40 animate-pulse" />
        <div className="mt-auto pt-2">
          <div className="h-4 w-12 rounded-full bg-border/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
