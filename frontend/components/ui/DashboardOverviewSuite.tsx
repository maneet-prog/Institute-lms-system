"use client";

type Metric = {
  label: string;
  value: number;
  change?: string;
};

type SeriesPoint = {
  label: string;
  value: number;
};

type DualPoint = {
  label: string;
  primary: number;
  secondary?: number;
};

type ScatterPoint = {
  label: string;
  x: number;
  y: number;
};

type BulletPoint = {
  label: string;
  value: number;
  target: number;
};

type TreemapPoint = {
  label: string;
  value: number;
  color: string;
};

function chartPath(points: number[], width: number, height: number) {
  const max = Math.max(...points, 1);
  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DashboardOverviewSuite({
  badge,
  heading,
  subheading,
  metrics,
  linePoints,
  columnPoints,
  barPoints,
  donutValue,
  scatterPoints,
  heatmapPoints,
  bulletPoints,
  treemapPoints,
  sparklinePoints
}: {
  badge: string;
  heading: string;
  subheading: string;
  metrics: Metric[];
  linePoints: SeriesPoint[];
  columnPoints: DualPoint[];
  barPoints: SeriesPoint[];
  donutValue: { value: number; total: number; label: string };
  scatterPoints: ScatterPoint[];
  heatmapPoints: SeriesPoint[];
  bulletPoints: BulletPoint[];
  treemapPoints: TreemapPoint[];
  sparklinePoints: number[];
}) {
  const donutPercent = donutValue.total ? Math.max(0, Math.min(100, Math.round((donutValue.value / donutValue.total) * 100))) : 0;
  const maxColumnValue = Math.max(1, ...columnPoints.map((point) => Math.max(point.primary, point.secondary || 0)));
  const maxBarValue = Math.max(1, ...barPoints.map((point) => point.value));
  const maxHeatValue = Math.max(1, ...heatmapPoints.map((point) => point.value));
  const treemapTotal = Math.max(1, treemapPoints.reduce((sum, item) => sum + item.value, 0));

  return (
    <section className="space-y-6">
      <div className="brand-card rounded-[2rem] border border-white/70 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">{badge}</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900">{heading}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{subheading}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            {metric.change ? <p className="mt-2 text-xs text-emerald-700">{metric.change}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Line Chart">
          <svg viewBox="0 0 320 120" className="h-36 w-full">
            <path d={chartPath(linePoints.map((point) => point.value), 320, 100)} fill="none" stroke="#A93A30" strokeWidth="3" />
            {linePoints.map((point, index) => {
              const x = (index / Math.max(linePoints.length - 1, 1)) * 320;
              const max = Math.max(...linePoints.map((item) => item.value), 1);
              const y = 100 - (point.value / max) * 100;
              return <circle key={point.label} cx={x} cy={y} r="4" fill="#143556" />;
            })}
          </svg>
          <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
            {linePoints.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Column Chart">
          <div className="grid h-40 grid-cols-4 items-end gap-4">
            {columnPoints.map((point) => (
              <div key={point.label} className="flex flex-col items-center gap-2">
                <div className="flex h-32 items-end gap-1">
                  <div className="w-4 rounded-t-full bg-brand-600" style={{ height: `${Math.max(8, (point.primary / maxColumnValue) * 100)}%` }} />
                  <div className="w-4 rounded-t-full bg-emerald-400" style={{ height: `${Math.max(8, ((point.secondary || 0) / maxColumnValue) * 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500">{point.label}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Bar Chart">
          <div className="space-y-3">
            {barPoints.map((point) => (
              <div key={point.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{point.label}</span>
                  <span>{point.value}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-gradient-to-r from-[#143556] to-[#A93A30]" style={{ width: `${(point.value / maxBarValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Donut Chart">
          <div className="flex items-center gap-6">
            <div
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#A93A30 0 ${donutPercent}%, #e2e8f0 ${donutPercent}% 100%)`
              }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-900">
                {donutPercent}%
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{donutValue.label}</p>
              <p className="mt-2 text-sm text-slate-600">
                {donutValue.value} of {donutValue.total}
              </p>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Scatter Plot">
          <svg viewBox="0 0 320 180" className="h-44 w-full rounded-2xl bg-slate-50">
            <line x1="20" y1="160" x2="300" y2="160" stroke="#cbd5e1" />
            <line x1="20" y1="20" x2="20" y2="160" stroke="#cbd5e1" />
            {scatterPoints.map((point) => (
              <circle
                key={point.label}
                cx={20 + point.x * 28}
                cy={160 - point.y * 20}
                r="6"
                fill="#A93A30"
                opacity="0.85"
              />
            ))}
          </svg>
        </ChartCard>

        <ChartCard title="Heatmap">
          <div className="grid grid-cols-7 gap-2">
            {heatmapPoints.map((point) => (
              <div
                key={point.label}
                className="rounded-2xl p-3 text-center text-xs font-medium text-slate-700"
                style={{
                  backgroundColor: `rgba(20, 53, 86, ${0.12 + point.value / maxHeatValue / 1.25})`
                }}
              >
                <p>{point.label}</p>
                <p className="mt-2">{point.value}</p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Bullet Chart">
          <div className="space-y-4">
            {bulletPoints.map((point) => {
              const safeTarget = Math.max(point.target, 1);
              return (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{point.label}</span>
                    <span>
                      {point.value}/{point.target}
                    </span>
                  </div>
                  <div className="relative h-4 rounded-full bg-slate-100">
                    <div className="h-4 rounded-full bg-brand-600" style={{ width: `${Math.min(100, (point.value / safeTarget) * 100)}%` }} />
                    <div className="absolute inset-y-0 w-0.5 bg-slate-900" style={{ left: `${Math.min(100, (point.target / safeTarget) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Treemap">
          <div className="grid min-h-44 grid-cols-6 gap-2">
            {treemapPoints.map((point) => (
              <div
                key={point.label}
                className="flex min-h-20 items-end rounded-2xl p-3 text-sm font-semibold text-white"
                style={{
                  background: point.color,
                  gridColumn: `span ${Math.max(2, Math.round((point.value / treemapTotal) * 6))}`
                }}
              >
                <div>
                  <p>{point.label}</p>
                  <p className="text-xs font-medium text-white/80">{point.value}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Sparkline">
          <div className="space-y-4">
            <svg viewBox="0 0 320 80" className="h-20 w-full">
              <path d={chartPath(sparklinePoints, 320, 64)} fill="none" stroke="#143556" strokeWidth="3" />
            </svg>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Low {Math.min(...sparklinePoints, 0)}</span>
              <span>High {Math.max(...sparklinePoints, 0)}</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}
