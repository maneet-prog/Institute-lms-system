"use client";

import { useMemo, useState } from "react";

import { useBatchesQuery, useReviewSubmissionMutation, useReviewableSubmissionsQuery } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export default function TeacherSubmissionsPage() {
  const { data: batches = [] } = useBatchesQuery(undefined, { refetchInterval: 15000 });
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const { data: submissions = [], isLoading } = useReviewableSubmissionsQuery(selectedBatchId || undefined, {
    refetchInterval: 15000
  });
  const reviewSubmission = useReviewSubmissionMutation();
  const [drafts, setDrafts] = useState<Record<string, { awarded_marks: string; feedback: string }>>({});

  const batchOptions = useMemo(
    () => [{ label: "All assigned batches", value: "" }, ...batches.map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))],
    [batches]
  );

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Teacher Review Desk</p>
        <h1 className="mt-2 text-2xl font-semibold">Student submissions and grading</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review quiz attempts, written answers, and uploaded activity work for your assigned batches.
        </p>
      </Card>

      <Card>
        <Select
          label="Filter by Batch"
          options={batchOptions}
          value={selectedBatchId}
          onChange={(event) => setSelectedBatchId(event.target.value)}
        />
      </Card>

      {isLoading ? <p className="text-sm text-slate-600">Loading submissions...</p> : null}

      <div className="space-y-4">
        {submissions.map((submission) => {
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
                    {submission.student?.first_name} {submission.student?.last_name} | {submission.batch.batch_name} | {submission.module.module_name}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {submission.review_status}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Latest Attempt</p>
                  <p className="text-sm text-slate-600">
                    Attempt {latestAttempt?.attempt_number} | Auto score {latestAttempt?.auto_score ?? 0}/{latestAttempt?.max_score ?? 0}
                  </p>
                  {latestAttempt?.response_text ? (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      {latestAttempt.response_text}
                    </div>
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
                    Save Marks
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && !submissions.length ? (
          <Card>
            <p className="text-sm text-slate-600">No submissions are waiting in the selected batch filter.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
