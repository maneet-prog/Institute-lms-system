"use client";

import { FormEvent, useMemo, useState } from "react";
import { Course, SubCourse } from "@/types/lms";
import {
  useAddContentMutation,
  useModulesQuery,
  useQuizPreviewMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { saveTecaiPreviewContent } from "@/utils/tecaiPreview";

interface Props {
  courses?: Course[];
  subcourses?: SubCourse[];
  selectedCourseId?: string;
  selectedSubcourseId?: string;
  batchId?: string;
  instituteId?: string;
  disableCoursePathSelection?: boolean;
  onSuccess?: () => void;
}

export function AddContentForm({
  courses = [],
  subcourses = [],
  selectedCourseId,
  selectedSubcourseId,
  batchId,
  instituteId,
  disableCoursePathSelection = false,
  onSuccess
}: Props) {
  const addContent = useAddContentMutation();
  const previewQuiz = useQuizPreviewMutation();

  const [content, setContent] = useState({
    batch_id: batchId ?? "",
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_id: "",
    title: "",
    category: "reading",
    duration: 60,
    order_index: 0,
    attempt_limit: 1,
    file: null as File | null
  });

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

  const quizPreviewContent =
    content.category === "reading" && previewQuiz.data
      ? {
        content_id: "preview-quiz",
        institute_id: instituteId ?? "",
        module_id: content.module_id,
        batch_id: content.batch_id,
        title: content.title || "Generated reading preview",
        type: "quiz",
        description: null,
        file_url: null,
        external_url: null,
        resolved_url: null,
        order_index: content.order_index,
        category: "reading",
        body_text: null,
        instructions: "",
        downloadable: false,
        response_type: null,
        quiz: previewQuiz.data,
        url: null,
        duration: content.duration
      }
      : null;

  const contentValidationMessage = (() => {
    if (!content.batch_id || !content.course_id || !content.subcourse_id || !content.module_id || !content.title.trim()) {
      return "Please fill all basic info fields.";
    }
    if (content.category === "reading" && !content.file) {
      return "Upload a DOCX file to generate the reading exam.";
    }
    if (content.category === "reading" && content.attempt_limit < 1) {
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

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (contentValidationMessage || content.category !== "reading") return;

    addContent.mutate(
      {
        batch_id: content.batch_id,
        module_id: content.module_id,
        title: content.title,
        type: "quiz",
        category: content.category,
        order_index: content.order_index,
        institute_id: instituteId,
        duration: content.duration,
        attempt_limit: content.attempt_limit,
        file: content.file
      },
      {
        onSuccess: () => {
          setContent((prev) => ({
            ...prev,
            title: "",
            order_index: 0,
            duration: 60,
            attempt_limit: 1,
            file: null
          }));
          previewQuiz.reset();
          onSuccess?.();
        }
      }
    );
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <h3 className="text-lg font-semibold">Add IELTS Exam Content</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create Reading, Writing, Listening, or Speaking exams for this batch.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Basic Info</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Batch ID" value={content.batch_id} disabled />
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
          <Select
            label="Exam Category"
            options={[
              { label: "Reading", value: "reading" },
              { label: "Writing", value: "writing" },
              { label: "Listening", value: "listening" },
              { label: "Speaking", value: "speaking" }
            ]}
            value={content.category}
            onChange={(e) => {
              previewQuiz.reset();
              setContent((prev) => ({
                ...prev,
                category: e.target.value,
                file: e.target.value === "reading" ? prev.file : null
              }));
            }}
            required
            disabled={addContent.isPending}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={String(content.duration)}
            onChange={(e) => setContent((prev) => ({ ...prev, duration: Number(e.target.value) }))}
            required
            disabled={addContent.isPending}
          />
          <Input
            label="Display Order"
            type="number"
            value={String(content.order_index)}
            onChange={(e) => setContent((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
            required
            disabled={addContent.isPending}
          />
        </div>
      </div>

      {content.category === "reading" ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">DOCX Reading Exam Generator</p>
              <p className="mt-1 text-sm text-slate-500">
                Upload the TECAI DOCX template and generate a preview of the rendered reading test before saving.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (content.file) {
                  previewQuiz.mutate(content.file);
                }
              }}
              disabled={!content.file || previewQuiz.isPending}
            >
              {previewQuiz.isPending ? "Generating Preview..." : "Generate Preview"}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Upload Source (DOCX)</span>
              <input
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  previewQuiz.reset();
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
                Number of times a student can take this reading exam.
              </p>
            </div>
          </div>

          {previewQuiz.error ? (
            <p className="mt-3 text-sm text-rose-700">
              {(previewQuiz.error as Error).message || "Unable to generate reading preview."}
            </p>
          ) : null}

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
            The {content.category} exam creator will be designed and implemented in the future.
          </p>
        </div>
      )}

      {content.category === "reading" ? (
        <>
          {contentValidationMessage ? <p className="text-sm text-amber-700">{contentValidationMessage}</p> : null}
          <Button type="submit" disabled={addContent.isPending || Boolean(contentValidationMessage)}>
            {addContent.isPending ? "Saving..." : "Save Exam Content"}
          </Button>
        </>
      ) : null}
    </form>
  );
}
