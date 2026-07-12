import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  message = "Cargando...",
  className = "",
}: LoadingOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-steam-bg-dark/85 backdrop-blur-[2px] ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <LoadingSpinner size="lg" />
      <p className="px-4 text-center text-sm font-medium text-steam-text">{message}</p>
    </div>
  );
}
