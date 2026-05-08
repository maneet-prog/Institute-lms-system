"use client";

import { useMemo, useState } from "react";

import { AddContentForm } from "@/components/forms/AddContentForm";
import { ReusableContentLibrary } from "@/components/content/ReusableContentLibrary";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { useBatchesQuery, useCoursesByInstituteQuery, useModulesQuery, useSubCoursesByInstituteQuery } from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

interface Props {
  badge: string;
  title: string;
  description: string;
}

export function ReusableContentWorkspace({ badge, title, description }: Props) {
  const authInstituteId = useAuthStore((state) => state.instituteId);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubcourseId, setSelectedSubcourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const { data: courses = [] } = useCoursesByInstituteQuery(authInstituteId ?? undefined);
  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const selectedInstituteId = authInstituteId ?? selectedCourse?.institute_id ?? undefined;
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery(
    selectedCourseId
      ? { institute_id: selectedInstituteId, course_id: selectedCourseId }
      : { institute_id: selectedInstituteId }
  );
  const { data: modules = [] } = useModulesQuery(
    selectedCourseId && selectedSubcourseId
      ? { institute_id: selectedInstituteId, course_id: selectedCourseId, subcourse_id: selectedSubcourseId }
      : undefined,
    { enabled: Boolean(selectedCourseId && selectedSubcourseId) }
  );
  const { data: batches = [] } = useBatchesQuery(selectedInstituteId);

  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          (!selectedCourseId || batch.course_id === selectedCourseId) &&
          (!selectedSubcourseId || batch.subcourse_id === selectedSubcourseId)
      ),
    [batches, selectedCourseId, selectedSubcourseId]
  );

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{badge}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Choose Course Path</h2>
        <p className="mt-1 text-sm text-slate-600">
          Reusable content is created module-wise and reused inside batches that belong to the same subcourse.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Course"
            options={[{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))]}
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedSubcourseId("");
              setSelectedModuleId("");
              setSelectedBatchId("");
            }}
          />
          <Select
            label="SubCourse"
            options={[{ label: "Select subcourse", value: "" }, ...subcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))]}
            value={selectedSubcourseId}
            onChange={(e) => {
              setSelectedSubcourseId(e.target.value);
              setSelectedModuleId("");
              setSelectedBatchId("");
            }}
            disabled={!selectedCourseId}
          />
          <Select
            label="Module"
            options={[{ label: "Select module", value: "" }, ...modules.map((module) => ({ label: module.module_name, value: module.module_id }))]}
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            disabled={!selectedSubcourseId}
          />
          <Select
            label="Batch To Assign"
            options={[{ label: "Select batch", value: "" }, ...filteredBatches.map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))]}
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={!selectedSubcourseId}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          {selectedCourseId && selectedSubcourseId && selectedModuleId && selectedInstituteId ? (
            <AddContentForm
              mode="reusable"
              courses={courses}
              subcourses={subcourses}
              selectedCourseId={selectedCourseId || undefined}
              selectedSubcourseId={selectedSubcourseId || undefined}
              selectedModuleId={selectedModuleId || undefined}
              instituteId={selectedInstituteId}
              disableCoursePathSelection
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Choose a course, subcourse, and module first. Then the reusable content creator will open with that path locked in.
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Reusable Library</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review saved content templates, update them, or assign them directly to the selected batch.
          </p>
          <div className="mt-4">
            <ReusableContentLibrary
              moduleId={selectedModuleId || undefined}
              selectedBatchId={selectedBatchId || undefined}
              instituteId={selectedInstituteId}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
