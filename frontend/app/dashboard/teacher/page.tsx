"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DashboardOverviewSuite } from "@/components/ui/DashboardOverviewSuite";
import { useBatchesQuery, useModulesQuery, useReviewableSubmissionsQuery } from "@/hooks/useLmsQueries";

const teacherSections = [
  { title: "Assigned batches", description: "See the groups you teach and move directly into each batch workspace.", href: "/dashboard/teacher/batches" },
  { title: "Teaching modules", description: "Review learning modules, resources, and delivery content from one place.", href: "/dashboard/teacher/modules" },
  { title: "Submissions to review", description: "Check quiz attempts and activity responses, then award marks with feedback.", href: "/dashboard/teacher/submissions" },
  { title: "Resource assignment", description: "Assign specific exams or resources directly to individual students.", href: "/dashboard/teacher/resources" }
];

export default function TeacherDashboardPage() {
  const { data: batches = [] } = useBatchesQuery(undefined, { refetchInterval: 15000 });
  const { data: modules = [] } = useModulesQuery(undefined, { refetchInterval: 15000 });
  const { data: submissions = [] } = useReviewableSubmissionsQuery(undefined, { refetchInterval: 15000 });

  const analytics = useMemo(() => {
    const pendingCount = submissions.filter((submission) => submission.review_status === "pending").length;
    const reviewedCount = submissions.filter((submission) => submission.review_status === "reviewed").length;
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        value: 0
      };
    });
    const dayMap = new Map(days.map((day) => [day.key, day]));
    submissions.forEach((submission) => {
      const sourceDate = submission.latest_submitted_at || submission.submitted_at;
      if (!sourceDate) return;
      const key = new Date(sourceDate).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.value += 1;
      }
    });

    const categoryCounts = submissions.reduce<Record<string, number>>((acc, submission) => {
      const key = submission.content.category || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      metrics: [
        { label: "Assigned batches", value: batches.length, change: "Live batch access" },
        { label: "Visible modules", value: modules.length, change: "Batch-linked learning units" },
        { label: "Pending reviews", value: pendingCount, change: "Needs teacher action" },
        { label: "Reviewed work", value: reviewedCount, change: "Completed grading" }
      ],
      linePoints: days,
      columnPoints: [
        { label: "Batches", primary: batches.length, secondary: 0 },
        { label: "Modules", primary: modules.length, secondary: 0 },
        { label: "Pending", primary: pendingCount, secondary: reviewedCount },
        { label: "Students", primary: new Set(submissions.map((submission) => submission.student?.user_id).filter(Boolean)).size, secondary: 0 }
      ],
      barPoints: Object.entries(categoryCounts).map(([label, value]) => ({ label, value })),
      donutValue: { value: reviewedCount, total: Math.max(submissions.length, 1), label: "Reviewed submission share" },
      scatterPoints: submissions.slice(0, 8).map((submission, index) => ({
        label: submission.content.title,
        x: index + 1,
        y: Math.max(1, Math.round((submission.latest_auto_score / Math.max(submission.max_score || 1, 1)) * 8))
      })),
      heatmapPoints: days,
      bulletPoints: [
        { label: "Review completion", value: reviewedCount, target: Math.max(submissions.length, 1) },
        { label: "Pending workload", value: pendingCount, target: Math.max(submissions.length, 1) },
        { label: "Module coverage", value: modules.length, target: Math.max(batches.length * 3, 1) }
      ],
      treemapPoints: batches.slice(0, 5).map((batch, index) => ({
        label: batch.batch_name,
        value: modules.length ? Math.max(1, Math.round(modules.length / Math.max(batches.length, 1))) : 1,
        color: ["#143556", "#A93A30", "#0f766e", "#b45309", "#475569"][index % 5]
      })),
      sparklinePoints: days.map((point) => point.value || 0)
    };
  }, [batches, modules, submissions]);

  return (
    <section className="page-shell">
      <DashboardOverviewSuite
        badge="Teacher Overview"
        heading="Deliver classes, track batches, and keep teaching organized"
        subheading="Your workspace is tuned for batch-based teaching so you can move between delivery groups, learning modules, learner submissions, and coaching expectations with less friction."
        metrics={analytics.metrics}
        linePoints={analytics.linePoints}
        columnPoints={analytics.columnPoints}
        barPoints={analytics.barPoints}
        donutValue={analytics.donutValue}
        scatterPoints={analytics.scatterPoints}
        heatmapPoints={analytics.heatmapPoints}
        bulletPoints={analytics.bulletPoints}
        treemapPoints={analytics.treemapPoints}
        sparklinePoints={analytics.sparklinePoints}
      />

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
