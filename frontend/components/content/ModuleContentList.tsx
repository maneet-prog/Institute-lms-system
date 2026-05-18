"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Content } from "@/types/lms";
import {
  useBatchDetailQuery,
  useDeleteContentMutation,
  useModuleContentsQuery,
  useUpdateContentMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MultiSelect } from "@/components/ui/MultiSelect";
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
  response_type: string;
  duration: number;
  attempt_limit: number;
  visibility_scope: "batch" | "selected_students";
  assigned_student_ids: string[];
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
  response_type: content.response_type ?? "",
  duration: content.duration,
  attempt_limit: content.quiz?.attempt_limit ?? 0,
  visibility_scope: content.visibility_scope ?? "batch",
  assigned_student_ids: content.assigned_student_ids ?? [],
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
  const { data: batchDetail } = useBatchDetailQuery(batchId);
  const deleteContent = useDeleteContentMutation();
  const updateContent = useUpdateContentMutation();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const studentOptions = (batchDetail?.students || []).map((student) => ({
    label: `${student.first_name} ${student.last_name}`,
    value: student.user_id
  }));

  const generatedPreviewContent =
    selectedContent &&
    form?.type === "quiz" &&
    previewUrl &&
    (form.category === "reading" || form.category === "writing")
      ? {
          ...selectedContent,
          title: form.title || selectedContent.title,
          instructions: form.instructions,
          duration: form.duration,
          file_url: previewUrl,
          quiz: null
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
                  {content.type}
                </p>
                {content.description ? (
                  <p className="mt-3 text-sm text-slate-600 line-clamp-3">{content.description.replace(/<[^>]+>/g, "")}</p>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex gap-2">
                  <IconButton
                    icon={<Pencil className="h-4 w-4" />}
                    label={`Edit ${content.title}`}
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedContent(content);
                      setForm(buildInitialForm(content));
                    }}
                  />
                  {content.type === "quiz" &&
                  (content.category === "reading" ||
                    content.category === "writing" ||
                    content.category === "speaking") ? (
                    <IconButton
                      icon={<Eye className="h-4 w-4" />}
                      label={`Preview ${content.title}`}
                      onClick={() => window.open(`/exam/${content.content_id}`, "_blank", "noopener,noreferrer")}
                    />
                  ) : null}
                  <IconButton
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                    label={`Delete ${content.title}`}
                    onClick={() =>
                      deleteContent.mutate({
                        contentId: content.content_id,
                        moduleId,
                        batchId
                      })
                    }
                    disabled={deleteContent.isPending}
                  />
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
          setPreviewUrl(null);
          setSelectedContent(null);
          setForm(null);
        }}
      >
        {selectedContent && form ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Pencil className="h-4 w-4 text-brand-600" />
                Update Content Details
              </div>
              <div className="grid gap-3 md:grid-cols-2">
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
                    setPreviewUrl(null);
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
                <Select
                  label="Visibility"
                  options={[
                    { label: "Entire batch", value: "batch" },
                    { label: "Specific students", value: "selected_students" }
                  ]}
                  value={form.visibility_scope}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            visibility_scope: e.target.value as "batch" | "selected_students",
                            assigned_student_ids:
                              e.target.value === "selected_students" ? prev.assigned_student_ids : []
                          }
                        : prev
                    )
                  }
                />
                <Input
                  label="External URL"
                  type="url"
                  value={form.external_url}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, external_url: e.target.value } : prev))}
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
              </div>
              <div className="mt-3 space-y-3">
                <Textarea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                />
                <Textarea
                  label="Instructions"
                  value={form.instructions}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, instructions: e.target.value } : prev))}
                />
              </div>
              {form.visibility_scope === "selected_students" ? (
                <div className="mt-3">
                  <MultiSelect
                    label="Visible To"
                    options={studentOptions}
                    value={form.assigned_student_ids}
                    onChange={(value) => setForm((prev) => (prev ? { ...prev, assigned_student_ids: value } : prev))}
                  />
                </div>
              ) : null}
            </div>
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
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setPreviewUrl(URL.createObjectURL(form.file));
                      }
                    }}
                    disabled={!form.file}
                  >
                    Generate Preview
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Upload Quiz Source (DOCX)</span>
                  <input
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      setPreviewUrl(null);
                      setForm((prev) => (prev ? { ...prev, file: e.target.files?.[0] ?? null } : prev));
                    }}
                  />
                </div>



                {generatedPreviewContent ||
                selectedContent.category === "reading" ||
                selectedContent.category === "writing" ||
                selectedContent.category === "speaking" ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">
                      Open the exact preview in a new tab to verify layout, content rendering, inputs, and timer behavior.
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
                      {selectedContent.category === "reading" ||
                      selectedContent.category === "writing" ||
                      selectedContent.category === "speaking" ? (
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
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.replace_file}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, replace_file: e.target.checked } : prev))}
                />
                Replace current uploaded file
              </label>
              <input
                className="mt-3 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                type="file"
                onChange={(e) => setForm((prev) => (prev ? { ...prev, file: e.target.files?.[0] ?? null } : prev))}
              />
            </div>
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
                        response_type: form.response_type,
                        duration: form.duration,
                        attempt_limit: form.attempt_limit,
                        visibility_scope: form.visibility_scope,
                        assigned_student_ids:
                          form.visibility_scope === "selected_students" ? form.assigned_student_ids : [],
                        replace_file: form.replace_file,
                        file: form.file
                      }
                    },
                    {
                      onSuccess: () => {
                        setPreviewUrl(null);
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
