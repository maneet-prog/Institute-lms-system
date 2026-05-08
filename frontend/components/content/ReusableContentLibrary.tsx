"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { Content } from "@/types/lms";
import {
  useAssignReusableContentMutation,
  useBatchDetailQuery,
  useDeleteReusableContentMutation,
  useQuizPreviewMutation,
  useReusableModuleContentsQuery,
  useUpdateReusableContentMutation
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
  replace_file: false,
  file: null
});

export function ReusableContentLibrary({
  moduleId,
  selectedBatchId,
  instituteId
}: {
  moduleId?: string;
  selectedBatchId?: string;
  instituteId?: string;
}) {
  const { data = [], isLoading } = useReusableModuleContentsQuery(moduleId);
  const { data: batchDetail } = useBatchDetailQuery(selectedBatchId, instituteId);
  const deleteContent = useDeleteReusableContentMutation();
  const updateContent = useUpdateReusableContentMutation();
  const assignContent = useAssignReusableContentMutation();
  const previewQuiz = useQuizPreviewMutation();
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [visibilityScope, setVisibilityScope] = useState<"batch" | "selected_students">("batch");
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);

  const studentOptions = useMemo(
    () =>
      (batchDetail?.students || []).map((student) => ({
        label: `${student.first_name} ${student.last_name}`,
        value: student.user_id
      })),
    [batchDetail]
  );

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

  if (!moduleId) {
    return <p className="text-sm text-slate-500">Select a course path and module to manage reusable content.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading reusable content...</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {data.length ? (
          data.map((content) => (
            <Card key={content.content_id} className="border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
                    {content.type}
                  </p>
                  {content.description ? (
                    <p className="mt-3 text-sm text-slate-600 line-clamp-3">{content.description.replace(/<[^>]+>/g, "")}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <IconButton
                    icon={<Pencil className="h-4 w-4" />}
                    label={`Edit ${content.title}`}
                    onClick={() => {
                      previewQuiz.reset();
                      setSelectedContent(content);
                      setForm(buildInitialForm(content));
                    }}
                  />
                  {content.type === "quiz" &&
                  (content.quiz?.renderer?.kind === "tecai_reading" ||
                    content.quiz?.renderer?.kind === "tecai_writing") ? (
                    <IconButton
                      icon={<Eye className="h-4 w-4" />}
                      label={`Preview ${content.title}`}
                      onClick={() => window.open(`/exam/${content.content_id}`, "_blank", "noopener,noreferrer")}
                    />
                  ) : null}
                  <IconButton
                    icon={<Plus className="h-4 w-4" />}
                    label={`Assign ${content.title}`}
                    onClick={() => {
                      setAssignTargetId(content.content_id);
                      setVisibilityScope("batch");
                      setAssignedStudentIds([]);
                    }}
                  />
                  <IconButton
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                    label={`Delete ${content.title}`}
                    onClick={() => deleteContent.mutate({ contentId: content.content_id, moduleId: content.module_id })}
                    disabled={deleteContent.isPending}
                  />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-slate-500">No reusable content exists for this module yet.</p>
        )}
      </div>

      <Modal
        title="Update Reusable Content"
        open={Boolean(selectedContent && form)}
        onClose={() => {
          previewQuiz.reset();
          setSelectedContent(null);
          setForm(null);
        }}
      >
        {selectedContent && form ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Title" value={form.title} onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))} />
              <Input label="Duration (minutes)" type="number" value={String(form.duration)} onChange={(e) => setForm((prev) => (prev ? { ...prev, duration: Number(e.target.value) } : prev))} />
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))} />
            <Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm((prev) => (prev ? { ...prev, instructions: e.target.value } : prev))} />
            <Input label="Attempt Limit" type="number" min="0" value={String(form.attempt_limit)} onChange={(e) => setForm((prev) => (prev ? { ...prev, attempt_limit: Math.max(0, Number(e.target.value) || 0) } : prev))} />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.replace_file} onChange={(e) => setForm((prev) => (prev ? { ...prev, replace_file: e.target.checked } : prev))} />
                Replace current DOCX/file
              </label>
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
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  updateContent.mutate(
                    {
                      contentId: selectedContent.content_id,
                      payload: {
                        title: form.title,
                        description: form.description,
                        external_url: form.external_url,
                        order_index: form.order_index,
                        category: form.category,
                        instructions: form.instructions,
                        response_type: form.response_type,
                        duration: form.duration,
                        attempt_limit: form.attempt_limit,
                        replace_file: form.replace_file,
                        file: form.file || undefined
                      }
                    },
                    {
                      onSuccess: () => {
                        setSelectedContent(null);
                        setForm(null);
                        previewQuiz.reset();
                      }
                    }
                  )
                }
                disabled={updateContent.isPending}
              >
                {updateContent.isPending ? "Saving..." : "Save Changes"}
              </Button>
              {generatedPreviewContent ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const previewKey = saveTecaiPreviewContent(generatedPreviewContent);
                    if (previewKey) {
                      window.open(`/exam/preview?preview_key=${encodeURIComponent(previewKey)}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  Open Preview
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Assign Reusable Content"
        open={Boolean(assignTargetId)}
        onClose={() => {
          setAssignTargetId(null);
          setVisibilityScope("batch");
          setAssignedStudentIds([]);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Assign this reusable content to the selected batch, or limit it to specific students inside that batch.
          </p>
          <Select
            label="Visibility"
            options={[
              { label: "Entire batch", value: "batch" },
              { label: "Specific students", value: "selected_students" }
            ]}
            value={visibilityScope}
            onChange={(e) => {
              setVisibilityScope(e.target.value as "batch" | "selected_students");
              if (e.target.value !== "selected_students") {
                setAssignedStudentIds([]);
              }
            }}
          />
          {visibilityScope === "selected_students" ? (
            <MultiSelect label="Students" options={studentOptions} value={assignedStudentIds} onChange={setAssignedStudentIds} />
          ) : null}
          <Button
            disabled={
              assignContent.isPending ||
              !assignTargetId ||
              !selectedBatchId ||
              (visibilityScope === "selected_students" && !assignedStudentIds.length)
            }
            onClick={() =>
              assignContent.mutate(
                {
                  contentId: assignTargetId as string,
                  payload: {
                    batch_id: selectedBatchId as string,
                    visibility_scope: visibilityScope,
                    assigned_student_ids: visibilityScope === "selected_students" ? assignedStudentIds : [],
                    institute_id: instituteId
                  }
                },
                {
                  onSuccess: () => {
                    setAssignTargetId(null);
                    setVisibilityScope("batch");
                    setAssignedStudentIds([]);
                  }
                }
              )
            }
          >
            {assignContent.isPending ? "Assigning..." : "Assign Content"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
