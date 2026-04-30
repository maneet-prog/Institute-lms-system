"use client";

import Link from "next/link";

import { OverviewBarChart } from "@/components/ui/OverviewBarChart";
import {
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useUsersByInstituteQuery
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

const instituteAdminSections = [
  { title: "Admissions and approvals", description: "Approve new users, assign access, and control institute-side onboarding.", href: "/dashboard/institute-admin/users" },
  { title: "Faculty operations", description: "Maintain teacher accounts and connect instructors to active batches.", href: "/dashboard/institute-admin/teachers" },
  { title: "Program catalog", description: "Build course and subcourse structures for each academic offering.", href: "/dashboard/institute-admin/courses" },
  { title: "Batch delivery", description: "Coordinate cohorts, dates, rooms, and student-teacher mappings.", href: "/dashboard/institute-admin/batches" }
];

export default function InstituteAdminDashboardPage() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: users = [] } = useUsersByInstituteQuery(instituteId ?? undefined, { refetchInterval: 15000 });
  const { data: courses = [] } = useCoursesByInstituteQuery(instituteId ?? undefined, { refetchInterval: 15000 });
  const { data: batches = [] } = useBatchesQuery(instituteId ?? undefined, { refetchInterval: 15000 });

  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Institute Admin Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Operate your institute with one connected LMS workspace</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Manage student intake, faculty coordination, courses, and batches the way growing institutes actually work, without splitting operations between multiple tools.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending approvals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{users.filter((user) => !user.is_approved).length}</p>
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
          title="Institute Operations Chart"
          subtitle="A live count snapshot from the current institute workspace."
          primaryLabel="Total"
          secondaryLabel="Pending / Active"
          points={[
            { label: "Users", value: users.length, secondaryValue: users.filter((user) => !user.is_approved).length },
            { label: "Teach", value: users.filter((user) => user.role_names.includes("teacher")).length, secondaryValue: 0 },
            { label: "Stud", value: users.filter((user) => user.role_names.includes("student")).length, secondaryValue: 0 },
            { label: "Course", value: courses.length, secondaryValue: 0 },
            { label: "Batch", value: batches.length, secondaryValue: 0 },
            { label: "Active", value: users.filter((user) => user.active).length, secondaryValue: 0 },
            { label: "Queue", value: users.filter((user) => !user.is_approved).length, secondaryValue: 0 }
          ]}
        />
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
