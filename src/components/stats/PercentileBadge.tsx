interface PercentileBadgeProps {
  label: string;
  percentile: number;
}

export function PercentileBadge({ label, percentile }: PercentileBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-steam-green/40 bg-steam-green/10 px-3 py-1 text-xs font-semibold text-steam-green">
      Top {percentile}% en {label}
    </span>
  );
}
