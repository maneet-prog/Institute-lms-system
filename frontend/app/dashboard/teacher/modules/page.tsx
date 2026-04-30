"use client";

import { useMemo, useState } from "react";

import { CourseManagementForms } from "@/components/forms/CourseManagementForms";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth";
import {
  useBatchesQuery,
  useCoursesQuery,
  useModulesQuery,
  useSubCoursesQuery
} from "@/hooks/useLmsQueries";

type TeacherFormMode = "module" | "content" | null;

export default function TeacherModulesPage() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: batches = [], isLoading: batchesLoading } = useBatchesQuery();
  const { data: courses = [] } = useCoursesQuery();
  const { data: subcourses = [] } = useSubCoursesQuery();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<TeacherFormMode>(null);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.batch_id === selectedBatchId) ?? batches[0] ?? null,
    [batches, selectedBatchId]
  );
  const selectedCourse = courses.find((course) => course.course_id === selectedBatch?.course_id) ?? null;
  const selectedSubcourse =
    subcourses.find((subcourse) => subcourse.subcourse_id === selectedBatch?.subcourse_id) ?? null;

  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery(
    selectedBatch
      ? { course_id: selectedBatch.course_id, subcourse_id: selectedBatch.subcourse_id }
      : undefined
  );

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Teacher Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold">Assigned Batch Modules</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review only the batches assigned to you and add module data only inside those batches.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">My Batches</h2>
        {batchesLoading ? (
          <p>Loading batches...</p>
        ) : (
          <DataTable
            rows={batches}
            rowKey={(row) => row.batch_id}
            initialPageSize={5}
            columns={[
              { key: "batch_name", header: "Batch" },
              { key: "course_id", header: "Course ID" },
              { key: "subcourse_id", header: "SubCourse ID" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedBatchId(row.batch_id);
                      setActiveForm(null);
                    }}
                  >
                    {selectedBatch?.batch_id === row.batch_id ? "Selected" : "Open"}
                  </Button>
                )
              }
            ]}
          />
        )}
      </Card>

      {selectedBatch ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Selected Batch</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedBatch.batch_name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Course: {selectedCourse?.course_name ?? selectedBatch.course_id}
              </p>
              <p className="text-sm text-slate-600">
                SubCourse: {selectedSubcourse?.subcourse_name ?? selectedBatch.subcourse_id}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeForm === "module" ? "secondary" : "primary"}
                onClick={() => setActiveForm((prev) => (prev === "module" ? null : "module"))}
              >
                {activeForm === "module" ? "Close Module Form" : "Add Module"}
              </Button>
              <Button
                variant={activeForm === "content" ? "secondary" : "primary"}
                onClick={() => setActiveForm((prev) => (prev === "content" ? null : "content"))}
              >
                {activeForm === "content" ? "Close Content Form" : "Add Content"}
              </Button>
            </div>
          </div>

          {activeForm ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CourseManagementForms
                mode={activeForm}
                courses={selectedCourse ? [selectedCourse] : []}
                subcourses={selectedSubcourse ? [selectedSubcourse] : []}
                selectedCourseId={selectedBatch.course_id}
                selectedSubcourseId={selectedBatch.subcourse_id}
                batchId={selectedBatch.batch_id}
                instituteId={instituteId ?? undefined}
                disableCoursePathSelection
                onSuccess={() => setActiveForm(null)}
              />
            </div>
          ) : null}

          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold">Modules In This Batch</h3>
            {modulesLoading ? (
              <p>Loading modules...</p>
            ) : (
              <DataTable
                rows={modules}
                rowKey={(row) => row.module_id}
                initialPageSize={5}
                columns={[
                  { key: "module_name", header: "Module" },
                  { key: "module_id", header: "Module ID" },
                  { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") }
                ]}
              />
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
