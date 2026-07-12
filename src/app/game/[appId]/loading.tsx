import { LoadingPanel } from "@/components/ui/LoadingPanel";

export default function GameLoading() {
  return (
    <div className="space-y-8">
      <div className="steam-shimmer h-4 w-48 rounded" />
      <div className="steam-panel overflow-hidden">
        <div className="steam-shimmer aspect-[920/430] w-full max-h-64 sm:max-h-80" />
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="steam-shimmer h-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="steam-panel p-6">
        <LoadingPanel message="Cargando juego..." minHeight="min-h-72" />
      </div>
    </div>
  );
}
