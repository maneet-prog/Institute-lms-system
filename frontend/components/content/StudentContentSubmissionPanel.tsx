"use client";

import { useMemo, useState } from "react";

import { useMarkContentProgressMutation, useSubmitStudentContentMutation } from "@/hooks/useLmsQueries";
import { StudentWorkspaceContent } from "@/types/lms";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

function getAttemptLimit(limit?: number | null) {
  return limit && limit > 0 ? limit : Number.MAX_SAFE_INTEGER;
}

function getGroupedQuestions(content: StudentWorkspaceContent) {
  const partById = new Map((content.exam?.parts || []).map((part) => [part.part_id || "", part]));
  const questions = content.quiz?.questions || [];

  if (!content.exam?.parts?.length) {
    return [{ key: "default", title: "Questions", questions }];
  }

  const groups = new Map<string, { key: string; title: string; questions: typeof questions }>();
  questions.forEach((question) => {
    const [partId] = question.question_id.split("::");
    const part = partById.get(partId);
    const key = partId || "default";
    const existing = groups.get(key) || {
      key,
      title: part?.title || "Questions",
      questions: []
    };
    existing.questions.push(question);
    groups.set(key, existing);
  });
  return [...groups.values()];
}

export function StudentContentSubmissionPanel({ content }: { content: StudentWorkspaceContent }) {
  const submitResponse = useSubmitStudentContentMutation();
  const markContentProgress = useMarkContentProgressMutation();
  const [textResponse, setTextResponse] = useState("");
  const [mediaResponse, setMediaResponse] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const attemptLimit = getAttemptLimit(content.quiz?.attempt_limit);
  const attemptsUsed = content.submission?.attempts.length || 0;
  const canSubmitAgain = attemptsUsed < attemptLimit;
  const groupedQuestions = useMemo(() => getGroupedQuestions(content), [content]);
  const isTecaiQuiz =
    content.type === "quiz" &&
    (content.quiz?.renderer?.kind === "tecai_reading" || content.quiz?.renderer?.kind === "tecai_writing");
  const isStructuredQuiz = content.type === "quiz" && Boolean(content.quiz?.questions?.length);
  const requiresTextResponse =
    content.type !== "quiz" && (content.response_type === "text" || !content.response_type);
  const requiresMediaResponse =
    content.type !== "quiz" && (content.response_type === "audio" || content.response_type === "video");

  if (isTecaiQuiz) {
    return null;
  }

  if (!isStructuredQuiz && !requiresTextResponse && !requiresMediaResponse && content.type !== "quiz") {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          markContentProgress.mutate({
            module_id: content.module_id,
            content_id: content.content_id,
            completed: true
          })
        }
        disabled={markContentProgress.isPending || Boolean(content.completed)}
      >
        {content.completed ? "Completed" : "Mark Content Complete"}
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {isStructuredQuiz ? "Submit exam answers" : "Submit your response"}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {attemptLimit === Number.MAX_SAFE_INTEGER
            ? `${attemptsUsed} attempt${attemptsUsed === 1 ? "" : "s"} used`
            : `${attemptsUsed}/${attemptLimit} attempts used`}
        </p>
        {content.completed ? (
          <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Completed
          </p>
        ) : null}
      </div>

      {isStructuredQuiz ? (
        <div className="space-y-4">
          {groupedQuestions.map((group) => (
            <div key={group.key} className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">{group.title}</p>
              {group.questions.map((question) => (
                <div key={question.question_id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-900">{question.prompt}</p>
                  {question.type === "mcq" ? (
                    <div className="mt-3 space-y-2">
                      {question.options.map((option) => (
                        <label key={option.option_id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name={question.question_id}
                            value={option.option_id}
                            checked={answers[question.question_id] === option.option_id}
                            onChange={(event) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.question_id]: event.target.value
                              }))
                            }
                          />
                          <span>{option.text}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <Textarea
                      label=""
                      value={answers[question.question_id] || ""}
                      onChange={(event) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.question_id]: event.target.value
                        }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          <Button
            type="button"
            disabled={!canSubmitAgain || submitResponse.isPending}
            onClick={() =>
              submitResponse.mutate({
                content_id: content.content_id,
                response_type: "quiz",
                answers: (content.quiz?.questions || []).map((question) =>
                  question.type === "mcq"
                    ? {
                        question_id: question.question_id,
                        selected_option_id: answers[question.question_id] || ""
                      }
                    : {
                        question_id: question.question_id,
                        response_text: answers[question.question_id] || ""
                      }
                )
              })
            }
          >
            {submitResponse.isPending ? "Submitting..." : canSubmitAgain ? "Submit Answers" : "Attempt Limit Reached"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requiresTextResponse ? (
            <Textarea label="Text Response" value={textResponse} onChange={(event) => setTextResponse(event.target.value)} />
          ) : null}
          {requiresMediaResponse ? (
            <Input
              label={content.response_type === "video" ? "Video URL" : "Audio URL"}
              type="url"
              value={mediaResponse}
              onChange={(event) => setMediaResponse(event.target.value)}
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={submitResponse.isPending}
              onClick={() =>
                submitResponse.mutate({
                  content_id: content.content_id,
                  response_type: content.response_type || "text",
                  response_text: requiresTextResponse ? textResponse : undefined,
                  response_url: requiresMediaResponse ? mediaResponse : undefined
                })
              }
            >
              {submitResponse.isPending ? "Submitting..." : "Submit Response"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={markContentProgress.isPending || Boolean(content.completed)}
              onClick={() =>
                markContentProgress.mutate({
                  module_id: content.module_id,
                  content_id: content.content_id,
                  completed: true
                })
              }
            >
              {content.completed ? "Completed" : "Mark Complete"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
