"use client";

import { FormEvent, useMemo, useState } from "react";

import { Course, SubCourse } from "@/types/lms";
import {
  useCreateCourseMutation,
  useCreateModuleMutation,
  useCreateSubCourseMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AddContentForm } from "@/components/forms/AddContentForm";

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

  const activeCourseId =
    mode === "module" ? module.course_id : selectedCourseId;

  const visibleSubcourses = useMemo(
    () => subcourses.filter((entry) => !activeCourseId || entry.course_id === activeCourseId),
    [activeCourseId, subcourses]
  );

  const courseOptions = [
    { label: "Select a course", value: "" },
    ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
  ];

  const subcourseOptions = [
    { label: "Select a subcourse", value: "" },
    ...visibleSubcourses.map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
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
          const submitModule = (replaceExisting = false) =>
            createModule.mutate(
              { ...module, institute_id: instituteId, replace_existing: replaceExisting },
              {
                onSuccess: () => {
                  setModule((prev) => ({ ...prev, module_name: "" }));
                  onSuccess?.();
                },
                onError: (error) => {
                  const message = error instanceof Error ? error.message : "Unable to save module.";
                  if (
                    !replaceExisting &&
                    message.toLowerCase().includes("already exists") &&
                    window.confirm("This module already exists in the selected subcourse. Do you want to replace it?")
                  ) {
                    submitModule(true);
                  }
                }
              }
            );

          submitModule(false);
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
    <AddContentForm
      courses={courses}
      subcourses={subcourses}
      selectedCourseId={selectedCourseId}
      selectedSubcourseId={selectedSubcourseId}
      batchId={batchId}
      instituteId={instituteId}
      disableCoursePathSelection={disableCoursePathSelection}
      onSuccess={onSuccess}
    />
  );
}
