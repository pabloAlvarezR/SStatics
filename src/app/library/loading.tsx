import { LoadingPanel } from "@/components/ui/LoadingPanel";

function SkeletonCard() {
  return (
    <div className="steam-panel overflow-hidden">
      <div className="steam-shimmer aspect-[460/215] w-full" />
      <div className="space-y-3 p-4">
        <div className="steam-shimmer h-4 w-3/4 rounded" />
        <div className="steam-shimmer h-8 w-1/3 rounded" />
      </div>
    </div>
  );
}

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="steam-shimmer h-8 w-48 rounded" />
        <div className="steam-shimmer h-4 w-64 rounded" />
      </div>
      <div className="steam-panel">
        <LoadingPanel message="Cargando biblioteca..." minHeight="min-h-48" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
