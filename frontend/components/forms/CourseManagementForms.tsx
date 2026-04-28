"use client";

import { FormEvent, useMemo, useState } from "react";

import { Course, SubCourse } from "@/types/lms";
import {
  useAddContentMutation,
  useCreateCourseMutation,
  useCreateModuleMutation,
  useCreateSubCourseMutation,
  useModulesQuery
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type CourseFormMode = "course" | "subcourse" | "module" | "content";

interface Props {
  mode: CourseFormMode;
  courses?: Course[];
  subcourses?: SubCourse[];
  selectedCourseId?: string;
  selectedSubcourseId?: string;
  batchId?: string;
  instituteId?: string;
  disableCoursePathSelection?: boolean;
  onSuccess?: () => void;
}

export function CourseManagementForms({
  mode,
  courses = [],
  subcourses = [],
  selectedCourseId,
  selectedSubcourseId,
  batchId,
  instituteId,
  disableCoursePathSelection = false,
  onSuccess
}: Props) {
  const createCourse = useCreateCourseMutation();
  const createSubcourse = useCreateSubCourseMutation();
  const createModule = useCreateModuleMutation();
  const addContent = useAddContentMutation();

  const [course, setCourse] = useState({
    course_name: "",
    description: "",
    image: null as File | null
  });
  const [subcourse, setSubcourse] = useState({
    course_id: selectedCourseId ?? "",
    subcourse_name: "",
    description: "",
    image: null as File | null
  });
  const [module, setModule] = useState({
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_name: ""
  });
  const [content, setContent] = useState({
    batch_id: batchId ?? "",
    course_id: selectedCourseId ?? "",
    subcourse_id: selectedSubcourseId ?? "",
    module_id: "",
    title: "",
    type: "text",
    category: "reading",
    description: "",
    external_url: "",
    order_index: 0,
    duration: 0,
    instructions: "",
    downloadable: false,
    response_type: "",
    file: null as File | null
  });

  const activeCourseId =
    mode === "module" ? module.course_id : mode === "content" ? content.course_id : selectedCourseId;

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

  const requiresDescription = content.type === "text" || content.type === "quiz";
  const allowsFileUpload = ["video", "audio", "pdf", "document"].includes(content.type);
  const contentValidationMessage = (() => {
    if (!content.batch_id || !content.course_id || !content.subcourse_id || !content.module_id || !content.title.trim()) {
      return null;
    }
    if (requiresDescription && !content.description.trim() && !content.external_url.trim()) {
      return "Add a description or external URL for text and quiz content.";
    }
    if (allowsFileUpload && !content.file && !content.external_url.trim()) {
      return "Upload a file or add an external URL for media and document content.";
    }
    if (!["reading", "listening"].includes(content.category) && !content.response_type) {
      return "Choose how students should submit their response.";
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

  if (mode === "course") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createCourse.mutate(
            { ...course, institute_id: instituteId },
            {
              onSuccess: () => {
                setCourse({
                  course_name: "",
                  description: "",
                  image: null
                });
                onSuccess?.();
              }
            }
          );
        }}
      >
        <h3 className="text-lg font-semibold">Add Course</h3>
        <Input
          label="Course Name"
          value={course.course_name}
          onChange={(e) => setCourse((prev) => ({ ...prev, course_name: e.target.value }))}
          required
        />
        <Textarea
          label="Description"
          value={course.description}
          onChange={(e) => setCourse((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Image</span>
          <input
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setCourse((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
          />
        </div>
        <Button type="submit" disabled={createCourse.isPending}>
          {createCourse.isPending ? "Saving..." : "Save Course"}
        </Button>
      </form>
    );
  }

  if (mode === "subcourse") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createSubcourse.mutate(
            { ...subcourse, institute_id: instituteId },
            {
              onSuccess: () => {
                setSubcourse((prev) => ({
                  ...prev,
                  subcourse_name: "",
                  description: "",
                  image: null
                }));
                onSuccess?.();
              }
            }
          );
        }}
      >
        <h3 className="text-lg font-semibold">Add SubCourse</h3>
        <Select
          label="Course"
          options={courseOptions}
          value={subcourse.course_id}
          onChange={(e) => setSubcourse((prev) => ({ ...prev, course_id: e.target.value }))}
          required
          disabled={disableCoursePathSelection}
        />
        <Input
          label="SubCourse Name"
          value={subcourse.subcourse_name}
          onChange={(e) => setSubcourse((prev) => ({ ...prev, subcourse_name: e.target.value }))}
          required
        />
        <Textarea
          label="Description"
          value={subcourse.description}
          onChange={(e) => setSubcourse((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Image</span>
          <input
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setSubcourse((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
          />
        </div>
        <Button type="submit" disabled={createSubcourse.isPending}>
          {createSubcourse.isPending ? "Saving..." : "Save SubCourse"}
        </Button>
      </form>
    );
  }

  if (mode === "module") {
    return (
      <form
        className="space-y-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          createModule.mutate(
            { ...module, institute_id: instituteId },
            {
              onSuccess: () => {
                setModule((prev) => ({ ...prev, module_name: "" }));
                onSuccess?.();
              }
            }
          );
        }}
      >
        <h3 className="text-lg font-semibold">Add Module</h3>
        <Select
          label="Course"
          options={courseOptions}
          value={module.course_id}
          onChange={(e) =>
            setModule((prev) => ({ ...prev, course_id: e.target.value, subcourse_id: "" }))
          }
          required
          disabled={disableCoursePathSelection}
        />
        <Select
          label="SubCourse"
          options={subcourseOptions}
          value={module.subcourse_id}
          onChange={(e) => setModule((prev) => ({ ...prev, subcourse_id: e.target.value }))}
          required
          disabled={disableCoursePathSelection}
        />
        <Input
          label="Module Name"
          value={module.module_name}
          onChange={(e) => setModule((prev) => ({ ...prev, module_name: e.target.value }))}
          required
        />
        <Button type="submit" disabled={createModule.isPending}>
          {createModule.isPending ? "Saving..." : "Save Module"}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        addContent.mutate(
          { ...content, institute_id: instituteId },
          {
            onSuccess: () => {
              setContent((prev) => ({
                ...prev,
                title: "",
                description: "",
                external_url: "",
                order_index: 0,
                duration: 0,
                instructions: "",
                downloadable: false,
                response_type: "",
                file: null
              }));
              onSuccess?.();
            }
          }
        );
      }}
    >
      <div>
        <h3 className="text-lg font-semibold">Add Content</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add material for this specific batch so content stays isolated from other batches on the same course path.
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
            label="Title"
            value={content.title}
            onChange={(e) => setContent((prev) => ({ ...prev, title: e.target.value }))}
            required
            disabled={addContent.isPending}
          />
          <Select
            label="Content Type"
            options={[
              { label: "Text / Notes", value: "text" },
              { label: "Video", value: "video" },
              { label: "Audio", value: "audio" },
              { label: "PDF", value: "pdf" },
              { label: "Document", value: "document" },
              { label: "Quiz", value: "quiz" }
            ]}
            value={content.type}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                type: e.target.value,
                file: ["video", "audio", "pdf", "document"].includes(e.target.value) ? prev.file : null
              }))
            }
            required
            disabled={addContent.isPending}
          />
          <Select
            label="Learning Category"
            options={[
              { label: "Reading", value: "reading" },
              { label: "Writing", value: "writing" },
              { label: "Listening", value: "listening" },
              { label: "Speaking", value: "speaking" }
            ]}
            value={content.category}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                category: e.target.value,
                response_type: ["writing", "speaking"].includes(e.target.value) ? prev.response_type : ""
              }))
            }
            required
            disabled={addContent.isPending}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Delivery</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            className="md:col-span-2"
            label={content.type === "quiz" ? "Description / Quiz JSON" : "Description / HTML Notes"}
            value={content.description}
            onChange={(e) => setContent((prev) => ({ ...prev, description: e.target.value }))}
            required={requiresDescription}
            disabled={addContent.isPending}
          />
          <Input
            label="External URL"
            type="url"
            value={content.external_url}
            onChange={(e) => setContent((prev) => ({ ...prev, external_url: e.target.value }))}
            disabled={addContent.isPending}
          />
          <div className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Upload File</span>
            <input
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              type="file"
              accept={
                content.type === "video"
                  ? "video/*"
                  : content.type === "audio"
                    ? "audio/*"
                    : content.type === "pdf"
                      ? ".pdf,application/pdf"
                      : content.type === "document"
                        ? ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        : undefined
              }
              disabled={!allowsFileUpload || addContent.isPending}
              onChange={(e) => setContent((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
            />
            <p className="text-xs text-slate-500">
              {allowsFileUpload
                ? "Use a local file or an external URL."
                : "File uploads are disabled for text and quiz content."}
            </p>
          </div>
          <Textarea
            className="md:col-span-2"
            label="Instructions / Prompt"
            value={content.instructions}
            onChange={(e) => setContent((prev) => ({ ...prev, instructions: e.target.value }))}
            disabled={addContent.isPending}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Learner Settings</p>
        <div className="grid gap-3 md:grid-cols-2">
          {content.category === "writing" || content.category === "speaking" ? (
            <Select
              label="Student Response Type"
              options={[
                { label: "Text", value: "text" },
                { label: "Audio", value: "audio" },
                { label: "Video", value: "video" }
              ]}
              value={content.response_type}
              onChange={(e) => setContent((prev) => ({ ...prev, response_type: e.target.value }))}
              required
              disabled={addContent.isPending}
            />
          ) : (
            <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
              Student response settings appear for writing and speaking activities.
            </div>
          )}
          <div className="flex items-center rounded-md border border-slate-200 px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={content.downloadable}
                onChange={(e) => setContent((prev) => ({ ...prev, downloadable: e.target.checked }))}
                disabled={addContent.isPending}
              />
              Allow students to download the file
            </label>
          </div>
          <Input
            label="Display Order"
            type="number"
            value={String(content.order_index)}
            onChange={(e) => setContent((prev) => ({ ...prev, order_index: Number(e.target.value) }))}
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
        </div>
      </div>

      {contentValidationMessage ? <p className="text-sm text-amber-700">{contentValidationMessage}</p> : null}
      <Button type="submit" disabled={addContent.isPending || Boolean(contentValidationMessage)}>
        {addContent.isPending ? "Saving..." : "Save Content"}
      </Button>
    </form>
  );
}
