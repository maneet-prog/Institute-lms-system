"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, MessageSquareText } from "lucide-react";

import { useBatchesQuery, useReviewSubmissionMutation, useReviewableSubmissionsQuery, useCoursesByInstituteQuery, useUsersByInstituteQuery } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

function formatScore(value: number | null | undefined, maxScore: number) {
  return maxScore > 0 ? `${value ?? 0}/${maxScore}` : String(value ?? 0);
}

interface Props {
  badge: string;
  title: string;
  description: string;
}

export function SubmissionReviewWorkspace({ badge, title, description }: Props) {
  const { data: batches = [] } = useBatchesQuery(undefined, { refetchInterval: 15000 });
  const { data: courses = [] } = useCoursesByInstituteQuery(undefined, { refetchInterval: 15000 });
  const { data: users = [] } = useUsersByInstituteQuery(undefined, { refetchInterval: 15000 });

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: submissions = [], isLoading } = useReviewableSubmissionsQuery(
    { batchId: selectedBatchId || undefined, courseId: selectedCourseId || undefined, userId: selectedUserId || undefined },
    { refetchInterval: 15000 }
  );
  const reviewSubmission = useReviewSubmissionMutation();
  const [drafts, setDrafts] = useState<Record<string, { awarded_marks: string; feedback: string }>>({});
  const groupedSubmissions = useMemo(() => {
    const groups = new Map<string, typeof submissions>();
    submissions.forEach((submission) => {
      const key = submission.batch.batch_name;
      const current = groups.get(key) || [];
      current.push(submission);
      groups.set(key, current);
    });
    return [...groups.entries()];
  }, [submissions]);

  const batchOptions = useMemo(
    () => [
      { label: "All accessible batches", value: "" },
      ...batches.map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
    ],
    [batches]
  );

  const courseOptions = useMemo(
    () => [
      { label: "All accessible courses", value: "" },
      ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
    ],
    [courses]
  );

  const studentOptions = useMemo(
    () => [
      { label: "All students", value: "" },
      ...users
        .filter((user) => user.role_names.includes("student"))
        .map((user) => ({ label: `${user.first_name} ${user.last_name}`, value: user.user_id }))
    ],
    [users]
  );

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{badge}</p>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Filter by Batch"
            options={batchOptions}
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
          />
          <Select
            label="Filter by Course"
            options={courseOptions}
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
          />
          <Select
            label="Filter by Student"
            options={studentOptions}
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
          />
        </div>
      </Card>

      {isLoading ? <p className="text-sm text-slate-600">Loading submissions...</p> : null}

      <div className="space-y-6">
        {groupedSubmissions.map(([batchName, batchSubmissions]) => (
          <section key={batchName} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{batchName}</h2>
                <p className="text-sm text-slate-600">{batchSubmissions.length} submission{batchSubmissions.length > 1 ? "s" : ""} in this batch.</p>
              </div>
            </div>

            {batchSubmissions.map((submission) => {
              const draft = drafts[submission.submission_id] || {
                awarded_marks: submission.latest_awarded_marks?.toString() || submission.latest_auto_score.toString(),
                feedback: submission.feedback || ""
              };
              const latestAttempt = submission.attempts[submission.attempts.length - 1];

              return (
                <Card key={submission.submission_id} className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{submission.content.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {submission.student?.first_name} {submission.student?.last_name} | {submission.module.module_name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        submission.review_status === "reviewed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {submission.review_status === "reviewed" ? "Reviewed" : "Pending review"}
                    </span>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.3fr,0.9fr]">
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attempt</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{latestAttempt?.attempt_number ?? 0}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Auto Score</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {formatScore(latestAttempt?.auto_score, latestAttempt?.max_score ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Final Score</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {formatScore(submission.latest_awarded_marks ?? latestAttempt?.auto_score, submission.max_score)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          Submitted {new Date(submission.latest_submitted_at || submission.submitted_at).toLocaleString("en-IN")}
                        </span>
                        {submission.reviewed_at ? (
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Reviewed {new Date(submission.reviewed_at).toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </div>

                      {latestAttempt?.response_text ? (
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                          {latestAttempt.response_text}
                        </pre>
                      ) : null}
                      {latestAttempt?.response_url ? (
                        <a href={latestAttempt.response_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
                          Open submitted file / media
                        </a>
                      ) : null}
                      {latestAttempt?.answers?.length ? (
                        <div className="space-y-2">
                          {latestAttempt.answers.map((answer) => (
                            <div key={answer.question_id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                              <p className="font-medium text-slate-900">{answer.prompt}</p>
                              <p className="mt-1">
                                {answer.question_type === "written"
                                  ? answer.response_text || "No response"
                                  : answer.selected_option_text || "No option selected"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                      <Input
                        label="Awarded Marks"
                        type="number"
                        min={0}
                        value={draft.awarded_marks}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [submission.submission_id]: { ...draft, awarded_marks: event.target.value }
                          }))
                        }
                      />
                      <Textarea
                        label="Feedback"
                        value={draft.feedback}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [submission.submission_id]: { ...draft, feedback: event.target.value }
                          }))
                        }
                      />
                      {submission.feedback ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                          <div className="mb-1 inline-flex items-center gap-2 font-medium">
                            <MessageSquareText className="h-4 w-4" />
                            Latest saved feedback
                          </div>
                          <p>{submission.feedback}</p>
                        </div>
                      ) : null}
                      <Button
                        onClick={() =>
                          reviewSubmission.mutate({
                            submissionId: submission.submission_id,
                            payload: {
                              attempt_number: latestAttempt?.attempt_number,
                              awarded_marks: Number(draft.awarded_marks || 0),
                              feedback: draft.feedback
                            }
                          })
                        }
                        disabled={reviewSubmission.isPending}
                      >
                        Save Review
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        ))}

        {!isLoading && !groupedSubmissions.length ? (
          <Card>
            <p className="text-sm text-slate-600">No submissions are waiting in the selected batch filter.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
