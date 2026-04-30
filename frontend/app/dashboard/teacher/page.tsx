"use client";

import Link from "next/link";
import { useMemo } from "react";

import { OverviewBarChart } from "@/components/ui/OverviewBarChart";
import { useBatchesQuery, useModulesQuery, useReviewableSubmissionsQuery } from "@/hooks/useLmsQueries";

const teacherSections = [
  { title: "Assigned batches", description: "See the groups you teach and move directly into each batch workspace.", href: "/dashboard/teacher/batches" },
  { title: "Teaching modules", description: "Review learning modules, resources, and delivery content from one place.", href: "/dashboard/teacher/modules" },
  { title: "Submissions to review", description: "Check quiz attempts and activity responses, then award marks with feedback.", href: "/dashboard/teacher/submissions" }
];

export default function TeacherDashboardPage() {
  const { data: batches = [] } = useBatchesQuery(undefined, { refetchInterval: 15000 });
  const { data: modules = [] } = useModulesQuery(undefined, { refetchInterval: 15000 });
  const { data: submissions = [] } = useReviewableSubmissionsQuery(undefined, { refetchInterval: 15000 });

  const chartPoints = useMemo(() => {
    return [
      { label: "Batch", value: batches.length, secondaryValue: 0 },
      { label: "Module", value: modules.length, secondaryValue: 0 },
      {
        label: "Pending",
        value: submissions.filter((submission) => submission.review_status === "pending").length,
        secondaryValue: submissions.filter((submission) => submission.review_status === "reviewed").length
      }
    ];
  }, [batches.length, modules.length, submissions]);

  return (
    <section className="page-shell">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Teacher Overview</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Deliver classes, track batches, and keep teaching organized</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Your workspace is tuned for batch-based teaching so you can move between delivery groups, learning modules, learner submissions, and institute expectations with less friction.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Assigned batches</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{batches.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Visible modules</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{modules.length}</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {submissions.filter((submission) => submission.review_status === "pending").length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <OverviewBarChart
          title="Teaching Snapshot"
          subtitle="Counts refresh whenever your dashboard queries refresh."
          primaryLabel="Current"
          secondaryLabel="Reviewed"
          points={chartPoints}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
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
