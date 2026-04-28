import { roleSpotlights } from "@/data/platformContent";

export default function AboutPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">About</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Built for institutes, academies, and multi-branch learning operations</h1>
        <p className="mt-4 max-w-4xl text-slate-600">
          Institute LMS is a role-based platform for organizations that need more than a simple course portal. It combines academic structure, operational control, learner management, and institute-level administration in one connected system.
        </p>
        <p className="mt-4 max-w-4xl text-slate-600">
          The platform now reflects the broader service scope institutes often compare against solutions like TalentLMS: onboarding, batch delivery, assessments, progress visibility, faculty coordination, and scalable multi-tenant administration.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleSpotlights.map((spotlight) => (
            <div key={spotlight.role} className="rounded-2xl bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">{spotlight.role}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{spotlight.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
