import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LoadingPanelProps {
  message?: string;
  className?: string;
  minHeight?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingPanel({
  message = "Cargando...",
  className = "",
  minHeight = "min-h-48",
  size = "lg",
}: LoadingPanelProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-4 py-10 text-center ${minHeight} ${className}`}
    >
      <LoadingSpinner size={size} />
      <p className="max-w-sm text-sm text-steam-text-muted">{message}</p>
    </div>
  );
}
