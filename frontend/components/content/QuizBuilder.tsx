"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export interface QuizDraft {
  mode: "mcq" | "written" | "mixed";
  attempt_limit: number;
  questions: Array<{
    question_id: string;
    type: "mcq" | "written";
    prompt: string;
    options: Array<{
      option_id: string;
      text: string;
    }>;
    correct_option_id?: string | null;
    reference_answer?: string | null;
    max_marks: number;
  }>;
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createOption = () => ({
  option_id: createId("option"),
  text: ""
});

const createQuestion = (type: "mcq" | "written" = "mcq") => ({
  question_id: createId("question"),
  type,
  prompt: "",
  options: type === "mcq" ? [createOption(), createOption()] : [],
  correct_option_id: null,
  reference_answer: "",
  max_marks: 1
});

export function createEmptyQuizDraft(): QuizDraft {
  return {
    mode: "mcq",
    attempt_limit: 0,
    questions: [createQuestion("mcq")]
  };
}

export function normalizeQuizDraft(value?: QuizDraft | null): QuizDraft {
  if (!value?.questions?.length) {
    return createEmptyQuizDraft();
  }
  return {
    mode: value.mode || "mcq",
    attempt_limit: value.attempt_limit ?? 0,
    questions: value.questions.map((question) => ({
      question_id: question.question_id || createId("question"),
      type: question.type || "mcq",
      prompt: question.prompt || "",
      options:
        question.type === "mcq"
          ? (question.options?.length ? question.options : [createOption(), createOption()]).map((option) => ({
              option_id: option.option_id || createId("option"),
              text: option.text || ""
            }))
          : [],
      correct_option_id: question.correct_option_id || null,
      reference_answer: question.reference_answer || "",
      max_marks: question.max_marks || 1
    }))
  };
}

export function QuizBuilder({
  value,
  onChange
}: {
  value: QuizDraft;
  onChange: (nextValue: QuizDraft) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Quiz Mode"
          options={[
            { label: "Multiple Choice", value: "mcq" },
            { label: "Written Exam", value: "written" },
            { label: "Mixed", value: "mixed" }
          ]}
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as QuizDraft["mode"] })}
        />
        <Input
          label="Attempt Limit (0 = Unlimited)"
          type="number"
          min="0"
          value={String(value.attempt_limit)}
          onChange={(event) =>
            onChange({
              ...value,
              attempt_limit: Math.max(0, Number(event.target.value) || 0)
            })
          }
        />
      </div>

      <div className="space-y-4">
        {value.questions.map((question, questionIndex) => (
          <div key={question.question_id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base font-semibold text-slate-900">Question {questionIndex + 1}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    onChange({
                      ...value,
                      questions: value.questions.filter((entry) => entry.question_id !== question.question_id)
                    })
                  }
                  disabled={value.questions.length === 1}
                >
                  Remove Question
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Select
                label="Question Type"
                options={[
                  { label: "Multiple Choice", value: "mcq" },
                  { label: "Written", value: "written" }
                ]}
                value={question.type}
                onChange={(event) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((entry) =>
                      entry.question_id === question.question_id
                        ? {
                            ...entry,
                            type: event.target.value as "mcq" | "written",
                            options: event.target.value === "mcq" ? entry.options.length ? entry.options : [createOption(), createOption()] : [],
                            correct_option_id: event.target.value === "mcq" ? entry.correct_option_id : null
                          }
                        : entry
                    )
                  })
                }
              />
              <Input
                label="Marks"
                type="number"
                min={1}
                value={String(question.max_marks)}
                onChange={(event) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((entry) =>
                      entry.question_id === question.question_id
                        ? { ...entry, max_marks: Math.max(1, Number(event.target.value) || 1) }
                        : entry
                    )
                  })
                }
              />
            </div>

            <Textarea
              className="mt-3"
              label="Question Prompt"
              value={question.prompt}
              onChange={(event) =>
                onChange({
                  ...value,
                  questions: value.questions.map((entry) =>
                    entry.question_id === question.question_id
                      ? { ...entry, prompt: event.target.value }
                      : entry
                  )
                })
              }
            />

            {question.type === "mcq" ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Options</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      onChange({
                        ...value,
                        questions: value.questions.map((entry) =>
                          entry.question_id === question.question_id
                            ? { ...entry, options: [...entry.options, createOption()] }
                            : entry
                        )
                      })
                    }
                  >
                    Add Option
                  </Button>
                </div>

                {question.options.map((option) => (
                  <div key={option.option_id} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <Input
                      label="Option Text"
                      value={option.text}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          questions: value.questions.map((entry) =>
                            entry.question_id === question.question_id
                              ? {
                                  ...entry,
                                  options: entry.options.map((entryOption) =>
                                    entryOption.option_id === option.option_id
                                      ? { ...entryOption, text: event.target.value }
                                      : entryOption
                                  )
                                }
                              : entry
                          )
                        })
                      }
                    />
                    <label className="flex items-center gap-2 self-end rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name={`correct-${question.question_id}`}
                        checked={question.correct_option_id === option.option_id}
                        onChange={() =>
                          onChange({
                            ...value,
                            questions: value.questions.map((entry) =>
                              entry.question_id === question.question_id
                                ? { ...entry, correct_option_id: option.option_id }
                                : entry
                            )
                          })
                        }
                      />
                      Correct
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        onChange({
                          ...value,
                          questions: value.questions.map((entry) =>
                            entry.question_id === question.question_id
                              ? {
                                  ...entry,
                                  options: entry.options.filter((entryOption) => entryOption.option_id !== option.option_id),
                                  correct_option_id:
                                    entry.correct_option_id === option.option_id ? null : entry.correct_option_id
                                }
                              : entry
                          )
                        })
                      }
                      disabled={question.options.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Textarea
                className="mt-4"
                label="Reference Answer"
                value={question.reference_answer || ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    questions: value.questions.map((entry) =>
                      entry.question_id === question.question_id
                        ? { ...entry, reference_answer: event.target.value }
                        : entry
                    )
                  })
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              questions: [...value.questions, createQuestion(value.mode === "written" ? "written" : "mcq")]
            })
          }
        >
          Add Question
        </Button>
        <Button type="button" variant="secondary" onClick={() => onChange(createEmptyQuizDraft())}>
          Reset Quiz
        </Button>
      </div>
    </div>
  );
}
