"use client";

import { useMemo } from "react";

import { AppLink } from "@/components/navigation/AppLink";
import { Card } from "@/components/ui/Card";
import { DashboardOverviewSuite } from "@/components/ui/DashboardOverviewSuite";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useStudentDashboardQuery } from "@/hooks/useLmsQueries";

const emptyDashboard = {
  student: {
    user_id: "",
    institute_id: "",
    first_name: "Student",
    last_name: "",
    email: ""
  },
  overview: {
    batch_count: 0,
    module_count: 0,
    completed_module_count: 0,
    pending_module_count: 0,
    average_progress_percent: 0,
    submission_count: 0,
    reviewed_submission_count: 0
  },
  activity_chart: [],
  batches: [],
  modules: [],
  submissions: []
};

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return "Schedule will appear when your batch timeline is added.";
  }
  return `${start || "TBD"} to ${end || "TBD"}`;
}

function formatLastAccessed(value?: string | null) {
  if (!value) {
    return "Not started yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently active";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatScore(value: number | string | null | undefined, maxScore: number) {
  if (value === null || value === undefined || value === "") {
    return "Pending review";
  }
  return maxScore > 0 ? `${value}/${maxScore}` : String(value);
}

export default function StudentDashboardPage() {
  const { data, isLoading } = useStudentDashboardQuery({ refetchInterval: 15000 });
  const dashboard = data ?? emptyDashboard;
  const spotlightModules = dashboard.modules.slice(0, 6);
  const analytics = useMemo(() => {
    const categoryCounts = dashboard.submissions.reduce<Record<string, number>>((acc, submission) => {
      acc[submission.content_type] = (acc[submission.content_type] || 0) + 1;
      return acc;
    }, {});

    return {
      metrics: [
        { label: "Active batches", value: dashboard.overview.batch_count, change: "Your current study groups" },
        { label: "Visible modules", value: dashboard.overview.module_count, change: "Live learning access" },
        { label: "Completed", value: dashboard.overview.completed_module_count, change: "Marked from your progress" },
        { label: "Average progress", value: dashboard.overview.average_progress_percent, change: "Percent complete" }
      ],
      linePoints: dashboard.activity_chart.map((point) => ({ label: point.label, value: point.submissions + point.module_completions })),
      columnPoints: dashboard.activity_chart.slice(-4).map((point) => ({
        label: point.label,
        primary: point.submissions,
        secondary: point.module_completions
      })),
      barPoints: Object.entries(categoryCounts).map(([label, value]) => ({ label, value })),
      donutValue: {
        value: dashboard.overview.completed_module_count,
        total: Math.max(dashboard.overview.module_count, 1),
        label: "Completed module share"
      },
      scatterPoints: dashboard.modules.slice(0, 8).map((module, index) => ({
        label: module.module_name,
        x: index + 1,
        y: Math.max(1, Math.round(module.progress_percent / 12.5))
      })),
      heatmapPoints: dashboard.activity_chart.map((point) => ({
        label: point.label,
        value: point.submissions + point.module_completions
      })),
      bulletPoints: [
        {
          label: "Module completion",
          value: dashboard.overview.completed_module_count,
          target: Math.max(dashboard.overview.module_count, 1)
        },
        {
          label: "Reviewed submissions",
          value: dashboard.overview.reviewed_submission_count,
          target: Math.max(dashboard.overview.submission_count, 1)
        },
        {
          label: "Average progress",
          value: dashboard.overview.average_progress_percent,
          target: 100
        }
      ],
      treemapPoints: dashboard.batches.slice(0, 5).map((batch, index) => ({
        label: batch.batch_name,
        value: Math.max(batch.module_count, 1),
        color: ["#143556", "#A93A30", "#0f766e", "#b45309", "#475569"][index % 5]
      })),
      sparklinePoints: dashboard.activity_chart.map((point) => point.submissions + point.module_completions)
    };
  }, [dashboard]);

  return (
    <div className="space-y-8">
      <DashboardOverviewSuite
        badge="Student Dashboard"
        heading={`Welcome back, ${dashboard.student.first_name}`}
        subheading="Keep your batches, study progress, upcoming practice, and next learning steps in one clear TecOnline workspace."
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
      {/* 
      <section className="flex flex-wrap gap-3">
        <AppLink
          href="/dashboard/student/courses"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Open Batch Workspaces
        </AppLink>
        <AppLink
          href="/dashboard/student/modules"
          className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Review Modules
        </AppLink>
      </section>

      {isLoading ? <p className="text-sm text-slate-600">Loading your dashboard...</p> : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Your Batches</h2>
            <p className="text-sm text-slate-600">Every assigned batch with progress and schedule context.</p>
          </div>
        </div>

        {dashboard.batches.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.batches.map((batch) => (
              <Card key={batch.batch_id} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{batch.batch_name}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{batch.course_name}</h3>
                    <p className="text-sm text-slate-600">{batch.subcourse_name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {batch.module_count} modules
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p>Room: {batch.room_name || "Not set"}</p>
                  <p>Schedule: {batch.schedule_notes || "Not set"}</p>
                  <p className="md:col-span-2">{formatDateRange(batch.start_date, batch.end_date)}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>
                      {batch.completed_module_count} of {batch.module_count} completed
                    </span>
                    <span>{batch.average_progress_percent}%</span>
                  </div>
                  <ProgressBar value={batch.average_progress_percent} />
                </div>

                <AppLink
                  href={`/dashboard/student/courses/${batch.batch_id}`}
                  className="inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Open batch workspace
                </AppLink>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-600">
              No batches are assigned yet. Once your institute maps you to a batch, it will appear here automatically.
            </p>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Continue Learning</h2>
            <p className="text-sm text-slate-600">The most relevant modules to resume next.</p>
          </div>
        </div>

        {spotlightModules.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {spotlightModules.map((module) => (
              <Card key={`${module.batch_id}-${module.module_id}`} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{module.module_name}</h3>
                    <p className="text-sm text-slate-600">
                      {module.batch_name} | {module.course_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {module.content_count} items
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <p>Next up: {module.next_content_title || "Content will appear here soon"}</p>
                  <p>Study time: {module.total_duration_minutes} minutes</p>
                  <p>Last active: {formatLastAccessed(module.last_accessed)}</p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>{module.completed ? "Completed" : "In progress"}</span>
                    <span>{module.progress_percent}%</span>
                  </div>
                  <ProgressBar value={module.progress_percent} />
                </div>

                <AppLink
                  href={`/dashboard/student/modules/${module.batch_id}/${module.module_id}`}
                  className="inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Open module detail
                </AppLink>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-600">
              Your modules will show up here as soon as content is added to your assigned batch.
            </p>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Your Submissions</h2>
            <p className="text-sm text-slate-600">Track quiz attempts, activity uploads, and review status in one place.</p>
          </div>
        </div>

        {dashboard.submissions.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.submissions.slice(0, 8).map((submission) => (
              <Card key={submission.submission_id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{submission.content_title}</p>
                    <p className="text-sm text-slate-600">
                      {submission.batch_name} | {submission.module_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Attempt {submission.latest_attempt_number}
                  </span>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>Type: {submission.submission_kind}</p>
                  <p>Status: {submission.review_status}</p>
                  <p>Auto score: {formatScore(submission.latest_auto_score, submission.max_score)}</p>
                  <p>Final marks: {formatScore(submission.latest_awarded_marks, submission.max_score)}</p>
                </div>
                {submission.feedback ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    Feedback: {submission.feedback}
                  </div>
                ) : null}
                <p className="text-xs text-slate-500">
                  Submitted on {new Date(submission.latest_submitted_at || submission.submitted_at).toLocaleString("en-IN")}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-600">
              Your submissions will appear here once you start responding to quizzes or activity prompts.
            </p>
          </Card>
        )}
      </section> */}
    </div>
  );
}
