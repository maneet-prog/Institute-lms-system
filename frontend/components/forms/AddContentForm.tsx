"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { Course, SubCourse } from "@/types/lms";
import {
  useAddContentMutation,
  useAddReusableContentMutation,
  useAssignReusableContentMutation,
  useBatchDetailQuery,
  useModulesQuery,
  useReusableModuleContentsQuery
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/auth";
import { saveTecaiPreviewContent } from "@/utils/tecaiPreview";

interface Props {
  courses?: Course[];
  subcourses?: SubCourse[];
  selectedCourseId?: string;
  selectedSubcourseId?: string;
  selectedModuleId?: string;
  batchId?: string;
  instituteId?: string;
  disableCoursePathSelection?: boolean;
  mode?: "batch" | "reusable";
  onSuccess?: () => void;
}

export function AddContentForm({
  courses = [],
  subcourses = [],
  selectedCourseId,
  selectedSubcourseId,
  selectedModuleId,
  batchId,
  instituteId,
  disableCoursePathSelection = false,
  mode = "batch",
  onSuccess
}: Props) {
  const addContent = useAddContentMutation();
  const addReusableContent = useAddReusableContentMutation();
  const assignReusableContent = useAssignReusableContentMutation();
  const role = useAuthStore((state) => state.role);
  const canUseReusableLibrary = mode === "batch" && (role === "super_admin" || role === "institute_admin");

  const [content, setContent] = useState({
    batch_id: batchId ?? "",
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_id: selectedModuleId ?? "",
    title: "",
    category: "reading",
    duration: 60,
    order_index: 0,
    attempt_limit: 1,
    visibility_scope: "batch" as "batch" | "selected_students",
    assigned_student_ids: [] as string[],
    external_url: "",
    file: null as File | null
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setContent((prev) => ({
      ...prev,
      batch_id: batchId ?? "",
      course_id: selectedCourseId ?? "",
      subcourse_id: selectedSubcourseId ?? "",
      module_id: selectedModuleId ?? ""
    }));
  }, [batchId, selectedCourseId, selectedSubcourseId, selectedModuleId]);

  const activeCourseId = content.course_id || selectedCourseId;
  const visibleSubcourses = useMemo(
    () => subcourses.filter((entry) => !activeCourseId || entry.course_id === activeCourseId),
    [activeCourseId, subcourses]
  );

  const { data: modules = [] } = useModulesQuery(
    content.subcourse_id
      ? {
          course_id: content.course_id,
          subcourse_id: content.subcourse_id,
          institute_id: instituteId
        }
      : undefined,
    { enabled: Boolean(content.course_id && content.subcourse_id) }
  );
  const { data: batchDetail } = useBatchDetailQuery(batchId, instituteId);
  const { data: reusableContents = [] } = useReusableModuleContentsQuery(content.module_id, {
    enabled: canUseReusableLibrary && Boolean(content.module_id)
  });
  const selectedModule = useMemo(
    () => modules.find((item) => item.module_id === content.module_id) ?? null,
    [modules, content.module_id]
  );
  const moduleCategory = selectedModule?.exam_type ?? "general";

  useEffect(() => {
    if (!content.module_id) return;
    setContent((prev) => ({ ...prev, category: moduleCategory }));
  }, [content.module_id, moduleCategory]);

  const supportsDocxGenerator = content.category === "reading" || content.category === "writing";
  const supportsListeningGenerator = content.category === "listening";
  const supportsExamCreation = supportsDocxGenerator || supportsListeningGenerator;

  const quizPreviewContent =
    supportsDocxGenerator && previewUrl
      ? {
          content_id: "preview-quiz",
          institute_id: instituteId ?? "",
          module_id: content.module_id,
          batch_id: content.batch_id,
          title: content.title || `Generated ${content.category} preview`,
          type: "quiz",
          description: null,
          file_url: previewUrl,
          external_url: null,
          resolved_url: null,
          order_index: content.order_index,
          category: content.category,
          body_text: null,
          instructions: "",
          response_type: null,
          quiz: null,
          url: null,
          duration: content.duration,
          exam: null
        }
      : null;

  const contentValidationMessage = (() => {
    if (
      (mode === "batch" && !content.batch_id) ||
      !content.course_id ||
      !content.subcourse_id ||
      !content.module_id ||
      !content.title.trim()
    ) {
      return "Please fill all basic info fields.";
    }
    if (mode === "batch" && content.visibility_scope === "selected_students" && !content.assigned_student_ids.length) {
      return "Choose at least one student for student-specific content.";
    }
    if (supportsDocxGenerator && !content.file) {
      return `Upload a DOCX file to generate the ${content.category} exam.`;
    }
    if (supportsListeningGenerator && !content.external_url.trim()) {
      return "Provide an audio link for listening exam.";
    }
    if (supportsListeningGenerator && !content.file) {
      return "Upload a listening prompt file.";
    }
    if (supportsExamCreation && content.attempt_limit < 1) {
      return "Attempt limit must be at least 1.";
    }
    return null;
  })();

  const courseOptions = [
    { label: "Select a course", value: "" },
    ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
  ];

  const subcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...visibleSubcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
  ];

  const moduleOptions = [
    { label: "Select a module", value: "" },
    ...modules.map((item) => ({ label: item.module_name, value: item.module_id }))
  ];
  const studentOptions = (batchDetail?.students || []).map((student) => ({
    label: `${student.first_name} ${student.last_name}`,
    value: student.user_id
  }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (contentValidationMessage || !supportsExamCreation) return;

    const commonPayload = {
      module_id: content.module_id,
      title: content.title,
      type: "quiz" as const,
      category: content.category,
      order_index: content.order_index,
      institute_id: instituteId,
      duration: content.duration,
      attempt_limit: content.attempt_limit,
      exam_type_id: content.subcourse_id,
      renderer_kind:
        content.category === "writing"
          ? "tecai_writing"
          : content.category === "reading"
            ? "tecai_reading"
            : content.category === "listening"
              ? "tecai_listening"
              : undefined,
      external_url: supportsListeningGenerator ? content.external_url.trim() : undefined,
      file: content.file
    };

    const resetForm = () => {
      setContent((prev) => ({
        ...prev,
        title: "",
        order_index: 0,
        duration: 60,
        attempt_limit: 1,
        external_url: "",
        visibility_scope: "batch",
        assigned_student_ids: [],
        file: null
      }));
      setPreviewUrl(null);
      onSuccess?.();
    };

    if (mode === "reusable") {
      addReusableContent.mutate(commonPayload, { onSuccess: resetForm });
      return;
    }

    addContent.mutate(
      {
        ...commonPayload,
        batch_id: content.batch_id,
        visibility_scope: content.visibility_scope,
        assigned_student_ids:
          content.visibility_scope === "selected_students" ? content.assigned_student_ids : []
      },
      { onSuccess: resetForm }
    );
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-lg font-semibold">
          {mode === "reusable" ? "Create Reusable SubCourse Content" : "Add IELTS Exam Content"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "reusable"
            ? "Create a reusable content template for this subcourse/module, then assign it to any batch later."
            : "Create exam content for the whole batch or target only selected students."}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Basic Info</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            label="Course"
            options={courseOptions}
            value={content.course_id}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                course_id: e.target.value,
                subcourse_id: "",
                module_id: ""
              }))
            }
            required
            disabled={disableCoursePathSelection || addContent.isPending}
          />
          <Select
            label="SubCourse"
            options={subcourseOptions}
            value={content.subcourse_id}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                subcourse_id: e.target.value,
                module_id: ""
              }))
            }
            required
            disabled={disableCoursePathSelection || !content.course_id || addContent.isPending}
          />
          <Select
            label="Module"
            options={moduleOptions}
            value={content.module_id}
            onChange={(e) => setContent((prev) => ({ ...prev, module_id: e.target.value }))}
            required
            disabled={!content.subcourse_id || addContent.isPending}
          />
          <Input
            label="Exam Title"
            value={content.title}
            onChange={(e) => setContent((prev) => ({ ...prev, title: e.target.value }))}
            required
            disabled={addContent.isPending}
          />
          <Input label="Exam Type" value={moduleCategory} disabled />
          <Input
            label="Duration (minutes)"
            type="number"
            value={String(content.duration)}
            onChange={(e) => setContent((prev) => ({ ...prev, duration: Number(e.target.value) }))}
            required
            disabled={addContent.isPending}
          />
          {mode === "batch" ? (
            <Select
              label="Content Visibility"
              options={[
                { label: "Entire batch", value: "batch" },
                { label: "Specific students", value: "selected_students" }
              ]}
              value={content.visibility_scope}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  visibility_scope: e.target.value as "batch" | "selected_students",
                  assigned_student_ids: e.target.value === "selected_students" ? prev.assigned_student_ids : []
                }))
              }
              disabled={addContent.isPending || !batchId}
            />
          ) : null}
        </div>
        {mode === "batch" && content.visibility_scope === "selected_students" ? (
          <div className="mt-4">
            <MultiSelect
              label="Visible To"
              options={studentOptions}
              value={content.assigned_student_ids}
              onChange={(value) => setContent((prev) => ({ ...prev, assigned_student_ids: value }))}
            />
          </div>
        ) : null}
      </div>

      {canUseReusableLibrary && content.module_id ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Use Precreated Content</p>
              <p className="mt-1 text-sm text-slate-500">
                Reuse saved subcourse content for this module and assign it to the full batch or selected students.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {reusableContents.length ? (
              reusableContents.map((item) => (
                <div key={item.content_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
                        {item.type}
                      </p>
                      {item.description ? (
                        <p className="mt-2 text-sm text-slate-600">{item.description.replace(/<[^>]+>/g, "")}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        assignReusableContent.isPending ||
                        !batchId ||
                        (content.visibility_scope === "selected_students" && !content.assigned_student_ids.length)
                      }
                      onClick={() =>
                        assignReusableContent.mutate({
                          contentId: item.content_id,
                          payload: {
                            batch_id: content.batch_id,
                            visibility_scope: content.visibility_scope,
                            assigned_student_ids:
                              content.visibility_scope === "selected_students" ? content.assigned_student_ids : [],
                            institute_id: instituteId
                          }
                        })
                      }
                    >
                      {assignReusableContent.isPending ? "Assigning..." : "Assign To This Batch"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No precreated reusable content is available for this module yet.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {supportsExamCreation ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {supportsListeningGenerator
                  ? "Listening Exam Creator"
                  : `DOCX ${content.category === "writing" ? "Writing" : "Reading"} Exam Generator`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {supportsListeningGenerator
                  ? "Provide the listening audio link and upload the prompt file before saving."
                  : `Upload the TECAI DOCX template and generate a preview of the rendered ${content.category} test before saving.`}
              </p>
            </div>
            {!supportsListeningGenerator ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (content.file) {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(URL.createObjectURL(content.file));
                  }
                }}
                disabled={!content.file}
              >
                Generate Preview
              </Button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {supportsListeningGenerator ? (
              <Input
                label="Listening Audio Link"
                value={content.external_url}
                onChange={(e) => setContent((prev) => ({ ...prev, external_url: e.target.value }))}
                required
                disabled={addContent.isPending}
              />
            ) : null}
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                {supportsListeningGenerator ? "Upload Listening Prompt File" : "Upload Source (DOCX)"}
              </span>
              <input
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                type="file"
                accept={
                  supportsListeningGenerator
                    ? ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    : ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
                onChange={(e) => {
                  setPreviewUrl(null);
                  setContent((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }));
                }}
              />
            </div>
            <div>
              <Input
                label="Attempt Limit"
                type="number"
                min={1}
                value={String(content.attempt_limit)}
                onChange={(e) => setContent((prev) => ({ ...prev, attempt_limit: parseInt(e.target.value, 10) || 1 }))}
                required
                disabled={addContent.isPending}
              />
              <p className="mt-1 text-xs text-slate-500">
                Number of times a student can take this {content.category} exam.
              </p>
            </div>
          </div>



          {quizPreviewContent ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Preview data is ready. Open it in a new tab to inspect the exact rendering.
              </p>
              <Button
                type="button"
                className="mt-3"
                onClick={() => {
                  const previewKey = saveTecaiPreviewContent(quizPreviewContent);
                  if (previewKey) {
                    window.open(`/exam/preview?preview_key=${encodeURIComponent(previewKey)}`, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Open Exact Preview
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          <p className="text-sm font-semibold text-slate-900">Functionality coming soon</p>
          <p className="mt-1 text-sm">
            The {moduleCategory} exam creator will be designed and implemented in the future.
          </p>
        </div>
      )}

      {supportsExamCreation ? (
        <>
          {contentValidationMessage ? <p className="text-sm text-amber-700">{contentValidationMessage}</p> : null}
          <Button
            type="submit"
            disabled={addContent.isPending || addReusableContent.isPending || Boolean(contentValidationMessage)}
          >
            {addContent.isPending || addReusableContent.isPending
              ? "Saving..."
              : mode === "reusable"
                ? "Save Reusable Content"
                : "Save Exam Content"}
          </Button>
        </>
      ) : null}
    </form>
  );
}
