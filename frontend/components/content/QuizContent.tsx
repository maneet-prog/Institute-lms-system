"use client";

import { useMemo, useState } from "react";

import { Content, StudentWorkspaceContent } from "@/types/lms";
import { useSubmitStudentContentMutation } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";

export function QuizContent({ content }: { content: Content | StudentWorkspaceContent }) {
  const submitResponse = useSubmitStudentContentMutation();
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; response_text?: string }>>({});

  const quiz = useMemo(() => content.quiz, [content.quiz]);
  const submission = "submission" in content ? content.submission : null;
  const attemptsUsed = submission?.attempts.length ?? 0;
  const attemptLimit = quiz?.attempt_limit ?? 1;
  const latestAttempt = submission?.attempts[submission.attempts.length - 1];

  if (!quiz?.questions.length) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Quiz questions are not configured yet for this content item.
      </div>
    );
  }

  const canSubmit = attemptsUsed < attemptLimit;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Quiz format: {quiz.mode}</p>
        <p className="mt-1">
          Attempts used: {attemptsUsed}/{attemptLimit}
        </p>
        {submission ? (
          <p className="mt-1">
            Latest marks: {submission.latest_awarded_marks ?? submission.latest_auto_score}/{submission.max_score}
            {" "}({submission.review_status})
          </p>
        ) : null}
      </div>

      {quiz.questions.map((question, index) => (
        <div key={question.question_id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-900">
            {index + 1}. {question.prompt}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
            {question.type} | {question.max_marks} marks
          </p>

          {question.type === "mcq" ? (
            <div className="mt-3 space-y-2">
              {question.options.map((option) => (
                <label key={option.option_id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={`quiz-${content.content_id}-${question.question_id}`}
                    checked={answers[question.question_id]?.selected_option_id === option.option_id}
                    onChange={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.question_id]: { selected_option_id: option.option_id }
                      }))
                    }
                    disabled={!canSubmit || submitResponse.isPending}
                  />
                  {option.text}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-3 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
              placeholder="Write your answer here"
              value={answers[question.question_id]?.response_text ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.question_id]: { response_text: event.target.value }
                }))
              }
              disabled={!canSubmit || submitResponse.isPending}
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!canSubmit || submitResponse.isPending}
          onClick={() =>
            submitResponse.mutate({
              content_id: content.content_id,
              response_type: "quiz",
              answers: quiz.questions.map((question) => ({
                question_id: question.question_id,
                selected_option_id: answers[question.question_id]?.selected_option_id,
                response_text: answers[question.question_id]?.response_text
              }))
            })
          }
        >
          {submitResponse.isPending ? "Submitting..." : canSubmit ? "Submit Quiz Attempt" : "Attempt Limit Reached"}
        </Button>
        {latestAttempt ? (
          <p className="text-sm text-slate-600">
            Last submitted on {new Date(latestAttempt.submitted_at).toLocaleString("en-IN")}
          </p>
        ) : null}
      </div>

      {submission?.attempts.length ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Attempt history</p>
          {submission.attempts.map((attempt: NonNullable<StudentWorkspaceContent["submission"]>["attempts"][number]) => (
            <div key={attempt.attempt_number} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              Attempt {attempt.attempt_number}: {attempt.awarded_marks ?? attempt.auto_score}/{attempt.max_score} | {attempt.status}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
