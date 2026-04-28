import Link from "next/link";

import { featureGroups, instituteServices, platformStats, roleSpotlights } from "@/data/platformContent";

export default function LandingPage() {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#ecfeff_48%,_#f8fafc_100%)]">
      <section className="page-shell pb-10 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">Institute Learning Platform</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              A complete LMS for institutes that need the depth of a TalentLMS-style service stack.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Manage admissions, faculty, batches, course catalogs, learner progress, and institute operations from one multi-tenant workspace built for academic delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/features" className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                Explore Features
              </Link>
              <Link href="/register" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-700">
                Start Institute Setup
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white/85 p-6 shadow-xl shadow-emerald-100/60 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              {platformStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-slate-900 p-5 text-white">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Built for institute service operations</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Support branch expansion, coaching operations, course delivery, student lifecycle management, and faculty coordination without splitting the workflow across disconnected tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-5 lg:grid-cols-3">
          {featureGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{group.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{group.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{group.description}</p>
              <div className="mt-6 space-y-3">
                {group.items.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell">
        <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Institute Services</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Everything an institute expects from a modern LMS service provider</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              This platform already supports the core LMS engine and now presents the broader service footprint institutes look for when evaluating enterprise-ready training platforms.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {instituteServices.map((service) => (
              <div key={service} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {roleSpotlights.map((spotlight) => (
            <div key={spotlight.role} className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">{spotlight.role}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{spotlight.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
