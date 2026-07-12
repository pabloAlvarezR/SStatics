interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  trendLabel?: string;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendLabel,
  highlight,
}: StatCardProps) {
  return (
    <div className="steam-stat-card">
      <p className="steam-stat-label">{label}</p>
      <p className={`steam-stat-value ${highlight ? "text-steam-green" : ""}`}>{value}</p>
      {subValue && <p className="steam-stat-sub">{subValue}</p>}
      {trend !== undefined && (
        <p className={`steam-stat-trend ${trend >= 0 ? "text-steam-green" : "text-red-400"}`}>
          {trend >= 0 ? "+" : ""}
          {trend}% {trendLabel}
        </p>
      )}
    </div>
  );
}
