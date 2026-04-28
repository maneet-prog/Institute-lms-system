import Link from "next/link";

const adminHighlights = [
  { title: "Institute network management", description: "Create institutes, review activity, and keep branch records consistent.", href: "/dashboard/admin/institutes" },
  { title: "Course governance", description: "Standardize program structures, subcourses, and learning hierarchies.", href: "/dashboard/admin/courses" },
  { title: "Batch operations", description: "Monitor cohort creation, schedules, and delivery readiness across institutes.", href: "/dashboard/admin/batches" },
  { title: "User approvals", description: "Handle registrations, role assignments, and pending notifications from one place.", href: "/dashboard/admin/notifications" }
];

export default function AdminDashboardPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Super Admin Overview</p>
        <h1 className="mt-3 text-3xl font-bold">Run a TalentLMS-style institute network from one control center</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Use the central dashboard to coordinate institutes, control delivery structures, and keep registrations, teaching resources, and operations aligned across the LMS.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {adminHighlights.map((item) => (
          <Link key={item.title} href={item.href} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-semibold text-slate-900">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-5 text-sm font-semibold text-emerald-700">Open workspace</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
