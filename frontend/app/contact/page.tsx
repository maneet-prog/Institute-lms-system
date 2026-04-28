export default function ContactPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Talk to the institute solutions team</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Reach out for institute onboarding, multi-branch setup, faculty rollout planning, course migration, or a guided walkthrough of the platform’s TalentLMS-style service coverage.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Email</p>
            <p className="mt-2 text-sm text-slate-600">support@institutelms.com</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Phone</p>
            <p className="mt-2 text-sm text-slate-600">+91 99999 99999</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Address</p>
            <p className="mt-2 text-sm text-slate-600">123 Learning Avenue, Academic District</p>
          </div>
        </div>
      </div>
    </section>
  );
}
