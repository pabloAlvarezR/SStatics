import { LoadingPanel } from "@/components/ui/LoadingPanel";

export default function FriendsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="steam-shimmer h-8 w-40 rounded" />
        <div className="steam-shimmer h-4 w-56 rounded" />
      </div>
      <div className="steam-panel">
        <LoadingPanel message="Cargando amigos..." />
      </div>
    </div>
  );
}
