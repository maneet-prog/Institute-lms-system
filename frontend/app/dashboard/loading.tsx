export default function DashboardLoading() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
      <div className="rounded-2xl border border-brand-100 bg-white px-6 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Loading</p>
        <p className="mt-2 text-sm text-slate-700">Opening your dashboard...</p>
      </div>
    </div>
  );
}

