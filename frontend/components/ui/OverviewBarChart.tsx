"use client";

interface ChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export function OverviewBarChart({
  title,
  subtitle,
  points,
  primaryLabel = "Primary",
  secondaryLabel = "Secondary"
}: {
  title: string;
  subtitle: string;
  points: ChartPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const maxValue = Math.max(
    1,
    ...points.map((point) => Math.max(point.value, point.secondaryValue || 0))
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            {primaryLabel}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            {secondaryLabel}
          </span>
        </div>
      </div>

      <div
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))` }}
      >
        {points.map((point) => (
          <div key={point.label} className="flex flex-col items-center gap-2">
            <div className="flex h-40 items-end gap-1">
              <div
                className="w-4 rounded-t-full bg-brand-500"
                style={{ height: point.value > 0 ? `${Math.max(8, (point.value / maxValue) * 100)}%` : "0%" }}
                title={`${primaryLabel}: ${point.value}`}
              />
              <div
                className="w-4 rounded-t-full bg-emerald-400"
                style={{
                  height:
                    (point.secondaryValue || 0) > 0
                      ? `${Math.max(8, ((point.secondaryValue || 0) / maxValue) * 100)}%`
                      : "0%"
                }}
                title={`${secondaryLabel}: ${point.secondaryValue || 0}`}
              />
            </div>
            <p className="text-xs font-medium text-slate-600">{point.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
