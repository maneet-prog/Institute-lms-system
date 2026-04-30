"use client";

import Link from "next/link";

import { OverviewBarChart } from "@/components/ui/OverviewBarChart";
import {
  useBatchesQuery,
  useCoursesQuery,
  useInstitutesQuery,
  useUsersQuery
} from "@/hooks/useLmsQueries";

const adminHighlights = [
  { title: "Institute network management", description: "Create institutes, review activity, and keep branch records consistent.", href: "/dashboard/admin/institutes" },
  { title: "Course governance", description: "Standardize program structures, subcourses, and learning hierarchies.", href: "/dashboard/admin/courses" },
  { title: "Batch operations", description: "Monitor cohort creation, schedules, and delivery readiness across institutes.", href: "/dashboard/admin/batches" },
  { title: "User approvals", description: "Handle registrations, role assignments, and pending notifications from one place.", href: "/dashboard/admin/notifications" }
];

export default function AdminDashboardPage() {
  const { data: institutes = [] } = useInstitutesQuery({ refetchInterval: 15000 });
  const { data: users = [] } = useUsersQuery({ refetchInterval: 15000 });
  const { data: courses = [] } = useCoursesQuery({ refetchInterval: 15000 });
  const { data: batches = [] } = useBatchesQuery(undefined, { refetchInterval: 15000 });

  return (
    <section className="page-shell">
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">Super Admin Overview</p>
        <h1 className="mt-3 text-3xl font-bold">Run a TalentLMS-style institute network from one control center</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Use the central dashboard to coordinate institutes, control delivery structures, and keep registrations, teaching resources, and operations aligned across the LMS.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Institutes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{institutes.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{courses.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Batches</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{batches.length}</p>
        </div>
      </div>

      <div className="mt-8">
        <OverviewBarChart
          title="Network Snapshot"
          subtitle="A live visual summary of the current admin workspace queries."
          primaryLabel="Total"
          secondaryLabel="Pending / Active"
          points={[
            { label: "Inst", value: institutes.length, secondaryValue: institutes.filter((institute) => institute.active).length },
            { label: "Users", value: users.length, secondaryValue: users.filter((user) => !user.is_approved).length },
            { label: "Teach", value: users.filter((user) => user.role_names.includes("teacher")).length, secondaryValue: 0 },
            { label: "Stud", value: users.filter((user) => user.role_names.includes("student")).length, secondaryValue: 0 },
            { label: "Course", value: courses.length, secondaryValue: 0 },
            { label: "Batch", value: batches.length, secondaryValue: 0 },
            { label: "Queue", value: users.filter((user) => !user.is_approved).length, secondaryValue: 0 }
          ]}
        />
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
