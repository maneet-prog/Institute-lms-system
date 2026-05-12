"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export interface EditableExamQuestion {
  question_id: string;
  prompt: string;
  type: "mcq" | "written";
  options_text: string;
  correct_option_index: number;
  reference_answer: string;
  max_marks: number;
}

export interface EditableExamPart {
  part_id: string;
  title: string;
  kind: "part" | "section" | "task";
  instructions: string;
  timer_seconds: number;
  prompt_html: string;
  prompt_text: string;
  image_url: string;
  audio_url: string;
  minimum_words: number;
  placeholder: string;
  questions: EditableExamQuestion[];
}

export function createEmptyEditableQuestion(index = 0): EditableExamQuestion {
  return {
    question_id: `question-${Date.now()}-${index + 1}`,
    prompt: "",
    type: "written",
    options_text: "",
    correct_option_index: 1,
    reference_answer: "",
    max_marks: 1
  };
}

export function createEmptyEditablePart(index = 0): EditableExamPart {
  return {
    part_id: `part-${Date.now()}-${index + 1}`,
    title: `Part ${index + 1}`,
    kind: "part",
    instructions: "",
    timer_seconds: 0,
    prompt_html: "",
    prompt_text: "",
    image_url: "",
    audio_url: "",
    minimum_words: 0,
    placeholder: "Start writing your response here...",
    questions: [createEmptyEditableQuestion(index)]
  };
}

export function serializeEditableExamParts(parts: EditableExamPart[]) {
  return parts.map((part, partIndex) => ({
    part_id: part.part_id || `part-${partIndex + 1}`,
    title: part.title || `Part ${partIndex + 1}`,
    kind: part.kind || "part",
    instructions: part.instructions || "",
    timer_seconds: Math.max(0, Number(part.timer_seconds || 0) || 0),
    passages: part.prompt_html
      ? [
          {
            asset_id: `${part.part_id}-prompt-html`,
            type: "html",
            content: part.prompt_html,
            title: "Prompt"
          }
        ]
      : part.prompt_text
        ? [
            {
              asset_id: `${part.part_id}-prompt-text`,
              type: "text",
              content: part.prompt_text,
              title: "Prompt"
            }
          ]
        : [],
    audio: part.audio_url
      ? [
          {
            asset_id: `${part.part_id}-audio`,
            type: "audio",
            url: part.audio_url,
            title: "Audio prompt"
          }
        ]
      : [],
    images: part.image_url
      ? [
          {
            asset_id: `${part.part_id}-image`,
            type: "image",
            url: part.image_url,
            title: "Image prompt"
          }
        ]
      : [],
    resources: [],
    answer_data: {
      prompt_html: part.prompt_html || "",
      prompt_text: part.prompt_text || "",
      minimum_words: Math.max(0, Number(part.minimum_words || 0) || 0),
      placeholder: part.placeholder || "Start writing your response here..."
    },
    questions: part.questions.map((question, questionIndex) => {
      const options = question.type === "mcq"
        ? question.options_text
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((text, optionIndex) => ({
              option_id: `${question.question_id}-option-${optionIndex + 1}`,
              text
            }))
        : [];
      const selectedOption =
        question.type === "mcq" ? options[Math.max(0, (question.correct_option_index || 1) - 1)] : null;

      return {
        question_id: question.question_id || `${part.part_id}-question-${questionIndex + 1}`,
        type: question.type,
        prompt: question.prompt,
        instructions: "",
        options,
        answer_key:
          question.type === "mcq"
            ? {
                optionId: selectedOption?.option_id || null,
                text: selectedOption?.text || null
              }
            : {
                referenceAnswer: question.reference_answer || ""
              },
        max_marks: Math.max(1, Number(question.max_marks || 1) || 1),
        order_index: questionIndex
      };
    }),
    order_index: partIndex
  }));
}

export function ExamPartBuilder({
  parts,
  onChange,
  moduleCategory
}: {
  parts: EditableExamPart[];
  onChange: (parts: EditableExamPart[]) => void;
  moduleCategory: string;
}) {
  const updatePart = (index: number, updater: (part: EditableExamPart) => EditableExamPart) => {
    onChange(parts.map((part, partIndex) => (partIndex === index ? updater(part) : part)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Structured Exam Builder</p>
          <p className="mt-1 text-sm text-slate-500">
            Build multi-part {moduleCategory} content with prompts, tables or HTML, images, audio, and graded questions.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => onChange([...parts, createEmptyEditablePart(parts.length)])}>
          Add Part
        </Button>
      </div>

      {parts.map((part, partIndex) => (
        <div key={part.part_id} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Part {partIndex + 1}</p>
            {parts.length > 1 ? (
              <Button type="button" variant="danger" onClick={() => onChange(parts.filter((_, index) => index !== partIndex))}>
                Remove Part
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Part Title"
              value={part.title}
              onChange={(event) => updatePart(partIndex, (current) => ({ ...current, title: event.target.value }))}
            />
            <Select
              label="Part Kind"
              options={[
                { label: "Part", value: "part" },
                { label: "Section", value: "section" },
                { label: "Task", value: "task" }
              ]}
              value={part.kind}
              onChange={(event) =>
                updatePart(partIndex, (current) => ({
                  ...current,
                  kind: event.target.value as EditableExamPart["kind"]
                }))
              }
            />
            <Input
              label="Part Timer (seconds)"
              type="number"
              value={String(part.timer_seconds)}
              onChange={(event) =>
                updatePart(partIndex, (current) => ({
                  ...current,
                  timer_seconds: Math.max(0, Number(event.target.value) || 0)
                }))
              }
            />
            <Input
              label="Minimum Words"
              type="number"
              value={String(part.minimum_words)}
              onChange={(event) =>
                updatePart(partIndex, (current) => ({
                  ...current,
                  minimum_words: Math.max(0, Number(event.target.value) || 0)
                }))
              }
            />
            <Input
              label="Image URL"
              type="url"
              value={part.image_url}
              onChange={(event) => updatePart(partIndex, (current) => ({ ...current, image_url: event.target.value }))}
            />
            <Input
              label="Audio URL"
              type="url"
              value={part.audio_url}
              onChange={(event) => updatePart(partIndex, (current) => ({ ...current, audio_url: event.target.value }))}
            />
          </div>

          <Textarea
            label="Instructions"
            value={part.instructions}
            onChange={(event) => updatePart(partIndex, (current) => ({ ...current, instructions: event.target.value }))}
          />
          <Textarea
            label="Prompt HTML"
            value={part.prompt_html}
            onChange={(event) => updatePart(partIndex, (current) => ({ ...current, prompt_html: event.target.value }))}
          />
          <Textarea
            label="Prompt Text"
            value={part.prompt_text}
            onChange={(event) => updatePart(partIndex, (current) => ({ ...current, prompt_text: event.target.value }))}
          />
          <Input
            label="Response Placeholder"
            value={part.placeholder}
            onChange={(event) => updatePart(partIndex, (current) => ({ ...current, placeholder: event.target.value }))}
          />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Questions</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  updatePart(partIndex, (current) => ({
                    ...current,
                    questions: [...current.questions, createEmptyEditableQuestion(current.questions.length)]
                  }))
                }
              >
                Add Question
              </Button>
            </div>

            {part.questions.map((question, questionIndex) => (
              <div key={question.question_id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">Question {questionIndex + 1}</p>
                  {part.questions.length > 1 ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() =>
                        updatePart(partIndex, (current) => ({
                          ...current,
                          questions: current.questions.filter((_, index) => index !== questionIndex)
                        }))
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  label="Prompt"
                  value={question.prompt}
                  onChange={(event) =>
                    updatePart(partIndex, (current) => ({
                      ...current,
                      questions: current.questions.map((item, index) =>
                        index === questionIndex ? { ...item, prompt: event.target.value } : item
                      )
                    }))
                  }
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <Select
                    label="Answer Type"
                    options={[
                      { label: "Written", value: "written" },
                      { label: "Multiple Choice", value: "mcq" }
                    ]}
                    value={question.type}
                    onChange={(event) =>
                      updatePart(partIndex, (current) => ({
                        ...current,
                        questions: current.questions.map((item, index) =>
                          index === questionIndex
                            ? {
                                ...item,
                                type: event.target.value as EditableExamQuestion["type"]
                              }
                            : item
                        )
                      }))
                    }
                  />
                  <Input
                    label="Max Marks"
                    type="number"
                    value={String(question.max_marks)}
                    onChange={(event) =>
                      updatePart(partIndex, (current) => ({
                        ...current,
                        questions: current.questions.map((item, index) =>
                          index === questionIndex
                            ? { ...item, max_marks: Math.max(1, Number(event.target.value) || 1) }
                            : item
                        )
                      }))
                    }
                  />
                  {question.type === "mcq" ? (
                    <Input
                      label="Correct Option #"
                      type="number"
                      value={String(question.correct_option_index)}
                      onChange={(event) =>
                        updatePart(partIndex, (current) => ({
                          ...current,
                          questions: current.questions.map((item, index) =>
                            index === questionIndex
                              ? {
                                  ...item,
                                  correct_option_index: Math.max(1, Number(event.target.value) || 1)
                                }
                              : item
                          )
                        }))
                      }
                    />
                  ) : null}
                </div>
                {question.type === "mcq" ? (
                  <Textarea
                    label="Options (one per line)"
                    value={question.options_text}
                    onChange={(event) =>
                      updatePart(partIndex, (current) => ({
                        ...current,
                        questions: current.questions.map((item, index) =>
                          index === questionIndex ? { ...item, options_text: event.target.value } : item
                        )
                      }))
                    }
                  />
                ) : (
                  <Textarea
                    label="Reference Answer"
                    value={question.reference_answer}
                    onChange={(event) =>
                      updatePart(partIndex, (current) => ({
                        ...current,
                        questions: current.questions.map((item, index) =>
                          index === questionIndex ? { ...item, reference_answer: event.target.value } : item
                        )
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
