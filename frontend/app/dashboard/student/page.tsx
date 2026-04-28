import Link from "next/link";

const studentSections = [
  { title: "My courses", description: "Access enrolled programs, progress pathways, and batch-linked course material.", href: "/dashboard/student/courses" },
  { title: "My modules", description: "Continue learning, open content resources, and review assignment-style activities.", href: "/dashboard/student/modules" }
];

export default function StudentDashboardPage() {
  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Student Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Stay on track across your learning path</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Use your student dashboard to move through institute courses, revisit study resources, submit work, and monitor completion without losing context.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {studentSections.map((section) => (
          <Link key={section.title} href={section.href} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-lg font-semibold text-slate-900">{section.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.description}</p>
            <p className="mt-5 text-sm font-semibold text-emerald-700">Continue</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
