export default function ContactPage() {
  return (
    <section className="page-shell">
      <div className="brand-card rounded-[2rem] border border-white/70 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Talk to the TecOnline support team</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Reach out for program guidance, student onboarding, batch planning, or support with your TecOnline Campus workspace.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-slate-900">Email</p>
            <p className="mt-2 text-sm text-slate-600">info@teconline.in</p>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-slate-900">Phone</p>
            <p className="mt-2 text-sm text-slate-600">9814115132, 9914915132</p>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-5">
            <p className="text-sm font-semibold text-slate-900">Hours</p>
            <p className="mt-2 text-sm text-slate-600">Mon - Sat, 8am - 6pm</p>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-5 md:col-span-3">
            <p className="text-sm font-semibold text-slate-900">Address</p>
            <p className="mt-2 text-sm text-slate-600">SCF 47, above Canara Bank, Phase 7, Sector 61, Sahibzada Ajit Singh Nagar, Punjab 160062, India</p>
          </div>
        </div>
      </div>
    </section>
  );
}
