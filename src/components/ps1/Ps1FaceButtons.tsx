interface Ps1FaceButtonsProps {
  className?: string;
  size?: "xs" | "sm";
}

const sizes = {
  xs: "gap-0.5 text-[9px]",
  sm: "gap-1 text-[11px]",
};

/** Símbolos clásicos del mando PS1: △ ○ ✕ □ */
export function Ps1FaceButtons({ className = "", size = "sm" }: Ps1FaceButtonsProps) {
  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight ${sizes[size]} ${className}`}
      aria-hidden="true"
    >
      <span className="text-emerald-400/80">△</span>
      <span className="text-rose-400/80">○</span>
      <span className="text-sky-400/80">✕</span>
      <span className="text-violet-400/80">□</span>
    </span>
  );
}
