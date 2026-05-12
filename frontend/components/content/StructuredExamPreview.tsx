"use client";

import { Content, ExamAsset, ExamPart } from "@/types/lms";

function AssetCard({ asset }: { asset: ExamAsset }) {
  if (asset.type === "image" && asset.url) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <img src={asset.url} alt={asset.title || "Exam asset"} className="max-h-[360px] w-full object-contain bg-slate-50" />
        {asset.title ? <div className="border-t border-slate-200 px-4 py-2 text-sm text-slate-600">{asset.title}</div> : null}
      </div>
    );
  }

  if (asset.type === "audio" && asset.url) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-slate-900">{asset.title || "Audio resource"}</p>
        <audio controls className="w-full">
          <source src={asset.url} />
        </audio>
      </div>
    );
  }

  if (asset.type === "html" && asset.content) {
    return (
      <div
        className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-4"
        dangerouslySetInnerHTML={{ __html: asset.content }}
      />
    );
  }

  if (asset.content) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {asset.title ? <p className="mb-2 text-sm font-medium text-slate-900">{asset.title}</p> : null}
        <div className="whitespace-pre-wrap text-sm text-slate-700">{asset.content}</div>
      </div>
    );
  }

  if (asset.url) {
    return (
      <a
        href={asset.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-brand-700 hover:bg-slate-50"
      >
        {asset.title || "Open resource"}
      </a>
    );
  }

  return null;
}

function QuestionPreview({
  question,
  index
}: {
  question: ExamPart["questions"][number];
  index: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">
        Q{index + 1}. {question.prompt}
      </p>
      {question.instructions ? <p className="mt-2 text-sm text-slate-600">{question.instructions}</p> : null}
      {question.options.length ? (
        <div className="mt-3 space-y-2">
          {question.options.map((option) => (
            <label key={option.option_id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <input type="radio" disabled />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
          Student response area
        </div>
      )}
    </div>
  );
}

function PartPreview({ part, index }: { part: ExamPart; index: number }) {
  const resourceGroups: Array<{ label: string; assets: ExamAsset[] }> = [
    { label: "Passages", assets: part.passages },
    { label: "Audio", assets: part.audio },
    { label: "Images", assets: part.images },
    { label: "Resources", assets: part.resources }
  ].filter((group) => group.assets.length);

  const answerData = (part.answer_data || {}) as {
    prompt_html?: string;
    promptHtml?: string;
    prompt_text?: string;
    promptText?: string;
  };
  const promptHtml = typeof answerData.prompt_html === "string"
    ? answerData.prompt_html
    : typeof answerData.promptHtml === "string"
      ? answerData.promptHtml
      : "";
  const promptText = typeof answerData.prompt_text === "string"
    ? answerData.prompt_text
    : typeof answerData.promptText === "string"
      ? answerData.promptText
      : "";

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            {part.kind || "Part"} {index + 1}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{part.title}</h3>
        </div>
        {part.timer_seconds > 0 ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            {Math.ceil(part.timer_seconds / 60)} min
          </span>
        ) : null}
      </div>

      {part.instructions ? <p className="text-sm text-slate-600">{part.instructions}</p> : null}
      {promptHtml ? (
        <div className="prose prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-4" dangerouslySetInnerHTML={{ __html: promptHtml }} />
      ) : null}
      {!promptHtml && promptText ? (
        <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{promptText}</div>
      ) : null}

      {resourceGroups.map((group) => (
        <div key={group.label} className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">{group.label}</p>
          <div className="space-y-3">
            {group.assets.map((asset, assetIndex) => (
              <AssetCard key={`${group.label}-${asset.asset_id || asset.url || asset.title || assetIndex}`} asset={asset} />
            ))}
          </div>
        </div>
      ))}

      {part.questions.length ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Questions</p>
          {part.questions.map((question, questionIndex) => (
            <QuestionPreview key={question.question_id || `${index}-${questionIndex}`} question={question} index={questionIndex} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function StructuredExamPreview({ content }: { content: Content }) {
  const parts = content.exam?.parts || [];

  if (parts.length) {
    return (
      <div className="space-y-4">
        {content.exam?.timer_seconds ? (
          <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Total duration: {Math.ceil(content.exam.timer_seconds / 60)} min
          </div>
        ) : null}
        {parts.map((part, index) => (
          <PartPreview key={part.part_id || `part-${index + 1}`} part={part} index={index} />
        ))}
      </div>
    );
  }

  if (content.quiz?.questions?.length) {
    return (
      <div className="space-y-3">
        {content.quiz.questions.map((question, index) => (
          <div key={question.question_id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              Q{index + 1}. {question.prompt}
            </p>
            {question.options.length ? (
              <div className="mt-3 space-y-2">
                {question.options.map((option) => (
                  <label key={option.option_id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                    <input type="radio" disabled />
                    <span>{option.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
                Student response area
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
