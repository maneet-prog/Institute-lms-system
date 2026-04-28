import Link from "next/link";

const instituteAdminSections = [
  { title: "Admissions and approvals", description: "Approve new users, assign access, and control institute-side onboarding.", href: "/dashboard/institute-admin/users" },
  { title: "Faculty operations", description: "Maintain teacher accounts and connect instructors to active batches.", href: "/dashboard/institute-admin/teachers" },
  { title: "Program catalog", description: "Build course and subcourse structures for each academic offering.", href: "/dashboard/institute-admin/courses" },
  { title: "Batch delivery", description: "Coordinate cohorts, dates, rooms, and student-teacher mappings.", href: "/dashboard/institute-admin/batches" }
];

export default function InstituteAdminDashboardPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Institute Admin Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Operate your institute with one connected LMS workspace</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Manage student intake, faculty coordination, courses, and batches the way growing institutes actually work, without splitting operations between multiple tools.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {instituteAdminSections.map((section) => (
          <Link key={section.title} href={section.href} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-semibold text-slate-900">{section.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            <p className="mt-5 text-sm font-semibold text-emerald-700">Go to module</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
