import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface LoadingOverlayProps {
  message?: string;
  className?: string;
  /** Si es false, el overlay es solo visual y no intercepta clics (refetch en segundo plano). */
  blocking?: boolean;
}

export function LoadingOverlay({
  message = "Cargando...",
  className = "",
  blocking = true,
}: LoadingOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg bg-steam-bg-dark/85 backdrop-blur-[2px] ${blocking ? "" : "pointer-events-none"} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <LoadingSpinner size="lg" />
      <p className="px-4 text-center text-sm font-medium text-steam-text">{message}</p>
    </div>
  );
}
