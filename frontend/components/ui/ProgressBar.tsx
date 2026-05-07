interface Props {
  value: number;
}

export function ProgressBar({ value }: Props) {
  return (
    <div className="w-full">
      <div className="h-2.5 w-full rounded-full bg-slate-200/80">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-brand-600 to-[#f0b44c] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-600">{value.toFixed(0)}%</p>
    </div>
  );
}
