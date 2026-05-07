import Link from "next/link";

import { featureGroups, instituteServices, platformStats } from "@/data/platformContent";

export default function LandingPage() {
  return (
    <div>
      <section className="page-shell pb-10 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-700">Welcome To Tajinder&apos;s English Classes</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-[#A93A30] sm:text-5xl">
              TecOnline Campus brings coaching, exam practice, and learner progress into one refined platform.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Inspired by the TecOnline brand, this workspace now reflects a more professional language-coaching identity for IELTS, PTE, CELPIP, TOEFL, Spoken English, French, and Duolingo preparation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/features" className="rounded-full bg-[#A93A30] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#A93A30]/15 transition hover:bg-[#143556]">
                Explore Programs
              </Link>
              <Link href="/register" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-brand-300 hover:text-brand-700">
                Get Started
              </Link>
            </div>
          </div>

          <div className="brand-card rounded-[2rem] border border-white/70 p-6 shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2">
              {platformStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-[#A93A30] p-5 text-white">
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-semibold text-slate-900">Built for real coaching operations</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Support admissions, batches, exam practice, teaching reviews, and learner follow-through without splitting the workflow across disconnected tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pt-0">
        <div className="grid gap-5 lg:grid-cols-3">
          {featureGroups.map((group) => (
            <div key={group.title} className="brand-card rounded-3xl border border-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">{group.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{group.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{group.description}</p>
              <div className="mt-6 space-y-3">
                {group.items.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-slate-50/80 p-4">
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
        <div className="brand-card grid gap-8 rounded-[2rem] border border-white/70 p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">TecOnline Services</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Everything your coaching team needs to teach, track, and support students better</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              From registration and batch delivery to TECAI exam practice and review queues, the platform now carries the same confident, learner-first direction as the TecOnline brand.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {instituteServices.map((service) => (
              <div key={service} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700">
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
