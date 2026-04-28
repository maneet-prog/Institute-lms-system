import Link from "next/link";

import { featureGroups, instituteServices, roleSpotlights } from "@/data/platformContent";

export default function FeaturesPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Platform Features</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight">
          Institute services modeled on what buyers expect from full-featured LMS platforms.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          This LMS now clearly presents the service scope institutes usually expect when comparing vendors: structured learning delivery, branch-ready administration, learner operations, assessments, reporting support, and stakeholder-specific experiences.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        {featureGroups.map((group) => (
          <div key={group.title} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{group.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{group.title}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{group.description}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => (
                <div key={item.title} className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Included Services</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">What institutes can present, run, and manage</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {instituteServices.map((service) => (
              <div key={service} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                {service}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Role Experience</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">A workspace for every stakeholder</h2>
          <div className="mt-6 space-y-4">
            {roleSpotlights.map((spotlight) => (
              <div key={spotlight.role} className="rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{spotlight.role}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{spotlight.summary}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Register Institute Team
            </Link>
            <Link href="/login" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:border-emerald-300 hover:text-emerald-700">
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
