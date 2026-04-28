interface Props {
  value: number;
}

export function ProgressBar({ value }: Props) {
  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-brand-600 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-600">{value.toFixed(0)}%</p>
    </div>
  );
}
