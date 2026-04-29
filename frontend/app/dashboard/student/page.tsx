"use client";

import { AppLink } from "@/components/navigation/AppLink";
import { Card } from "@/components/ui/Card";
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
    average_progress_percent: 0
  },
  batches: [],
  modules: []
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

export default function StudentDashboardPage() {
  const { data, isLoading } = useStudentDashboardQuery();
  const dashboard = data ?? emptyDashboard;
  const spotlightModules = dashboard.modules.slice(0, 6);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Student Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Welcome back, {dashboard.student.first_name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Keep your batches, module progress, and next study steps in one place. This page is powered by a fresh
          student dashboard API so the overview loads from a single stable request.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
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
        </div>
      </section>

      {isLoading ? <p className="text-sm text-slate-600">Loading your dashboard...</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Active batches</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.overview.batch_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Visible modules</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.overview.module_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dashboard.overview.completed_module_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Average progress</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {dashboard.overview.average_progress_percent}%
          </p>
        </Card>
      </section>

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
                  href={`/dashboard/student/courses/${module.batch_id}`}
                  className="inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Resume from batch workspace
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
    </div>
  );
}
