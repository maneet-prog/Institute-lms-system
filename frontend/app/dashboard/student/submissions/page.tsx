"use client";

import { Card } from "@/components/ui/Card";
import { AppLink } from "@/components/navigation/AppLink";
import { DashboardOverviewSuite } from "@/components/ui/DashboardOverviewSuite";
import { useStudentDashboardQuery } from "@/hooks/useLmsQueries";

function formatScore(value: number | string | null | undefined, maxScore: number) {
  if (value === null || value === undefined || value === "") {
    return "Pending review";
  }
  return maxScore > 0 ? `${value}/${maxScore}` : String(value);
}

export default function StudentSubmissionsPage() {
  const { data, isLoading } = useStudentDashboardQuery({ refetchInterval: 15000 });
  const dashboard = data;

  const submissions = dashboard?.submissions ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Loading your submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Submissions</h2>
            <p className="text-sm text-slate-600">Click back to learning sections to start new attempts.</p>
          </div>
          <div className="flex gap-2">
            <AppLink href="/dashboard/student/courses" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              My Courses
            </AppLink>
            <AppLink href="/dashboard/student/modules" className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              My Modules
            </AppLink>
          </div>
        </div>

        {submissions.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {submissions.map((submission) => (
              <Card key={submission.submission_id} className="space-y-3 p-5">
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
          <Card className="p-5">
            <p className="text-sm text-slate-600">
              Your submissions will appear here once you start responding to quizzes or activity prompts.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}

