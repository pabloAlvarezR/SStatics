interface ActivityHeatmapProps {
  data: { date: string; hours: number }[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const maxHours = Math.max(...data.map((d) => d.hours), 0.1);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-1.5">
        {data.map((day) => {
          const intensity = day.hours / maxHours;
          const opacity = day.hours > 0 ? Math.max(0.2, intensity) : 0.08;
          return (
            <div key={day.date} className="flex flex-col items-center gap-1.5">
              <div
                title={`${day.date}: ${day.hours}h`}
                className="h-8 w-8 rounded-md border border-steam-border/20 sm:h-9 sm:w-9"
                style={{
                  backgroundColor: `rgba(164, 208, 7, ${opacity})`,
                }}
              />
              <span className="text-[9px] text-steam-text-muted">
                {new Date(day.date).getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
