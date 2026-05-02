"use client";

import { useState } from "react";

import { Content } from "@/types/lms";
import {
  useDeleteContentMutation,
  useModuleContentsQuery,
  useQuizPreviewMutation,
  useUpdateContentMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { saveTecaiPreviewContent } from "@/utils/tecaiPreview";

type EditFormState = {
  title: string;
  type: string;
  description: string;
  external_url: string;
  order_index: number;
  category: string;
  instructions: string;
  downloadable: boolean;
  response_type: string;
  duration: number;
  attempt_limit: number;
  replace_file: boolean;
  file: File | null;
};

const buildInitialForm = (content: Content): EditFormState => ({
  title: content.title,
  type: content.type,
  description: content.description ?? "",
  external_url: content.external_url ?? "",
  order_index: content.order_index,
  category: content.category ?? "reading",
  instructions: content.instructions ?? "",
  downloadable: Boolean(content.downloadable),
  response_type: content.response_type ?? "",
  duration: content.duration,
  attempt_limit: content.quiz?.attempt_limit ?? 0,
  replace_file: false,
  file: null
});

export function ModuleContentList({
  moduleId,
  batchId,
  canManage = false
}: {
  moduleId: string;
  batchId: string;
  canManage?: boolean;
}) {
  const { data = [], isLoading } = useModuleContentsQuery(moduleId, batchId);
  const deleteContent = useDeleteContentMutation();
  const updateContent = useUpdateContentMutation();
  const previewQuiz = useQuizPreviewMutation();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);

  const generatedPreviewContent =
    selectedContent && form?.type === "quiz" && previewQuiz.data
      ? {
          ...selectedContent,
          title: form.title || selectedContent.title,
          instructions: form.instructions,
          duration: form.duration,
          quiz: previewQuiz.data
        }
      : null;

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading module content...</p>;
  }

  if (!data.length) {
    return <p className="text-sm text-slate-500">No content added to this module yet.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((content: Content) => (
          <Card key={content.content_id} className="border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
                  {content.type} | Order {content.order_index}
                </p>
                {content.description ? (
                  <p className="mt-3 text-sm text-slate-600 line-clamp-3">{content.description.replace(/<[^>]+>/g, "")}</p>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      previewQuiz.reset();
                      setSelectedContent(content);
                      setForm(buildInitialForm(content));
                    }}
                  >
                    Edit
                  </Button>
                  {content.type === "quiz" && content.quiz?.renderer?.kind === "tecai_reading" ? (
                    <Button
                      variant="secondary"
                      onClick={() => window.open(`/exam/${content.content_id}`, "_blank", "noopener,noreferrer")}
                    >
                      Preview
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      deleteContent.mutate({
                        contentId: content.content_id,
                        moduleId,
                        batchId
                      })
                    }
                    disabled={deleteContent.isPending}
                  >
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Modal
        title="Update Content"
        open={Boolean(selectedContent && form)}
        onClose={() => {
          previewQuiz.reset();
          setSelectedContent(null);
          setForm(null);
        }}
      >
        {selectedContent && form ? (
          <div className="space-y-3">
            <Input label="Title" value={form.title} onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))} />
            <Select
              label="Type"
              options={[
                { label: "Text / Notes", value: "text" },
                { label: "Video", value: "video" },
                { label: "Audio", value: "audio" },
                { label: "PDF", value: "pdf" },
                { label: "Document", value: "document" },
                { label: "Quiz", value: "quiz" }
              ]}
              value={form.type}
              onChange={(e) => {
                previewQuiz.reset();
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        type: e.target.value
                      }
                    : prev
                );
              }}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
            />
            <Input
              label="External URL"
              type="url"
              value={form.external_url}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, external_url: e.target.value } : prev))}
            />
            <Select
              label="Category"
              options={[
                { label: "Reading", value: "reading" },
                { label: "Writing", value: "writing" },
                { label: "Listening", value: "listening" },
                { label: "Speaking", value: "speaking" }
              ]}
              value={form.category}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, category: e.target.value } : prev))}
            />
            <Textarea
              label="Instructions"
              value={form.instructions}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, instructions: e.target.value } : prev))}
            />
            {form.type === "quiz" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">DOCX Quiz Generator</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Replace the quiz source document when you want to regenerate the reading renderer.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (form.file) {
                        previewQuiz.mutate(form.file);
                      }
                    }}
                    disabled={!form.file || previewQuiz.isPending}
                  >
                    {previewQuiz.isPending ? "Generating Preview..." : "Generate Preview"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Upload Quiz Source (DOCX)</span>
                  <input
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      previewQuiz.reset();
                      setForm((prev) => (prev ? { ...prev, file: e.target.files?.[0] ?? null } : prev));
                    }}
                  />
                </div>

                {previewQuiz.error ? (
                  <p className="text-sm text-rose-700">
                    {(previewQuiz.error as Error).message || "Unable to generate quiz preview."}
                  </p>
                ) : null}

                {generatedPreviewContent || selectedContent.quiz?.renderer?.kind === "tecai_reading" ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">
                      Open the exact `testing.html` preview in a new tab to verify layout, numbering, inputs, and drag-drop behavior.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {generatedPreviewContent ? (
                        <Button
                          type="button"
                          onClick={() => {
                            const previewKey = saveTecaiPreviewContent(generatedPreviewContent);
                            if (previewKey) {
                              window.open(`/exam/preview?preview_key=${encodeURIComponent(previewKey)}`, "_blank", "noopener,noreferrer");
                            }
                          }}
                        >
                          Open Exact Preview
                        </Button>
                      ) : null}
                      {selectedContent.quiz?.renderer?.kind === "tecai_reading" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => window.open(`/exam/${selectedContent.content_id}`, "_blank", "noopener,noreferrer")}
                        >
                          Open Saved Exam
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Input
              label="Display Order"
              type="number"
              value={String(form.order_index)}
              onChange={(e) =>
                setForm((prev) => (prev ? { ...prev, order_index: Number(e.target.value) } : prev))
              }
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={String(form.duration)}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, duration: Number(e.target.value) } : prev))}
            />
            <Input
              label="Attempt Limit (0 = Unlimited)"
              type="number"
              min="0"
              value={String(form.attempt_limit)}
              onChange={(e) => setForm((prev) => (prev ? { ...prev, attempt_limit: Math.max(0, Number(e.target.value) || 0) } : prev))}
            />
            {(form.category === "writing" || form.category === "speaking") ? (
              <Select
                label="Response Type"
                options={[
                  { label: "Text", value: "text" },
                  { label: "Audio", value: "audio" },
                  { label: "Video", value: "video" }
                ]}
                value={form.response_type}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, response_type: e.target.value } : prev))}
              />
            ) : null}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.downloadable}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, downloadable: e.target.checked } : prev))}
              />
              Allow download
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.replace_file}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, replace_file: e.target.checked } : prev))}
              />
              Replace current uploaded file
            </label>
            <input
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              type="file"
              onChange={(e) => setForm((prev) => (prev ? { ...prev, file: e.target.files?.[0] ?? null } : prev))}
            />
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  updateContent.mutate(
                    {
                      contentId: selectedContent.content_id,
                      payload: {
                        batch_id: batchId,
                        title: form.title,
                        type: form.type,
                        description: form.description,
                        external_url: form.external_url,
                        order_index: form.order_index,
                        category: form.category,
                        instructions: form.instructions,
                        downloadable: form.downloadable,
                        response_type: form.response_type,
                        duration: form.duration,
                        attempt_limit: form.attempt_limit,
                        replace_file: form.replace_file,
                        file: form.file
                      }
                    },
                    {
                      onSuccess: () => {
                        previewQuiz.reset();
                        setSelectedContent(null);
                        setForm(null);
                      }
                    }
                  )
                }
                disabled={updateContent.isPending}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedContent(null);
                  setForm(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

    </>
  );
}
