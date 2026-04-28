"use client";

import { useMemo, useState } from "react";

import { Content } from "@/types/lms";
import { Button } from "@/components/ui/Button";

interface QuizQuestion {
  question: string;
  options: string[];
  answer?: string;
}

export function QuizContent({ content }: { content: Content }) {
  const questions = useMemo(() => {
    if (!content.description) {
      return [];
    }
    try {
      const parsed = JSON.parse(content.description) as { questions?: QuizQuestion[] };
      return parsed.questions ?? [];
    } catch {
      return [];
    }
  }, [content.description]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions.length) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Add quiz questions as JSON in the description field using
        {" "}
        <code>{`{"questions":[{"question":"...","options":["A","B"],"answer":"A"}]}`}</code>.
      </div>
    );
  }

  const score = questions.reduce((total, question, index) => {
    return total + (question.answer && answers[index] === question.answer ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <div key={`${question.question}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-medium text-slate-900">{question.question}</p>
          <div className="mt-3 space-y-2">
            {question.options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={`quiz-${content.content_id}-${index}`}
                  checked={answers[index] === option}
                  onChange={() => setAnswers((prev) => ({ ...prev, [index]: option }))}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => setSubmitted(true)}>
          Check Answers
        </Button>
        {submitted ? <p className="text-sm text-emerald-700">Score: {score}/{questions.length}</p> : null}
      </div>
    </div>
  );
}
