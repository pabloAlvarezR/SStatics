import { LoadingPanel } from "@/components/ui/LoadingPanel";

export default function ProfileLoading() {
  return (
    <div className="steam-panel">
      <LoadingPanel message="Cargando perfil..." minHeight="min-h-96" />
    </div>
  );
}
