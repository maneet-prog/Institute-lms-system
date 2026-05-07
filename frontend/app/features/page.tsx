import Link from "next/link";

import { featureGroups, instituteServices } from "@/data/platformContent";

export default function FeaturesPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] bg-[#A93A30] p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#f0b44c]">Platform Features</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight">
          A TecOnline-inspired product experience for coaching teams, trainers, and students.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          The full platform now aligns with the language-coaching identity of Tajinder&apos;s English Classes while preserving the same workflows for learning delivery, student operations, assessments, and review.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        {featureGroups.map((group) => (
          <div key={group.title} className="brand-card rounded-[2rem] border border-white/70 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{group.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">{group.title}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{group.description}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.items.map((item) => (
                <div key={item.title} className="rounded-2xl bg-slate-50/80 p-5">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="brand-card rounded-[2rem] border border-white/70 p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Included Services</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">What TecOnline teams can present, run, and manage</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {instituteServices.map((service) => (
              <div key={service} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                {service}
              </div>
            ))}
          </div>
        </div>

        <div className="brand-card rounded-[2rem] border border-white/70 p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">Role Experience</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">A workspace for every stakeholder</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-full bg-[#A93A30] px-5 py-3 text-sm font-semibold text-white hover:bg-[#143556]">
              Register Now
            </Link>
            <Link href="/login" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:border-brand-300 hover:text-brand-700">
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
