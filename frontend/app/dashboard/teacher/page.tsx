import Link from "next/link";

const teacherSections = [
  { title: "Assigned batches", description: "See the groups you teach and move directly into each batch workspace.", href: "/dashboard/teacher/batches" },
  { title: "Teaching modules", description: "Review learning modules, resources, and delivery content from one place.", href: "/dashboard/teacher/modules" }
];

export default function TeacherDashboardPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Teacher Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Deliver classes, track batches, and keep teaching organized</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Your workspace is tuned for batch-based teaching so you can move between delivery groups, learning modules, and institute expectations with less friction.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {teacherSections.map((section) => (
          <Link key={section.title} href={section.href} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-semibold text-slate-900">{section.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            <p className="mt-5 text-sm font-semibold text-emerald-700">Open workspace</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
