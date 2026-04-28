"use client";

import { useMemo, useState } from "react";

import { CourseManagementForms } from "@/components/forms/CourseManagementForms";
import { CourseCatalogTables } from "@/components/tables/CourseCatalogTables";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCoursesQuery, useModulesQuery, useSubCoursesQuery } from "@/hooks/useLmsQueries";

type FormMode = "course" | "subcourse" | "module" | null;

interface Props {
  badge: string;
  title: string;
  description: string;
}

export function CourseManagementWorkspace({ badge, title, description }: Props) {
  const { data: courses = [], isLoading: coursesLoading } = useCoursesQuery();
  const { data: subcourses = [], isLoading: subcoursesLoading } = useSubCoursesQuery();
  const [activeForm, setActiveForm] = useState<FormMode>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const selectedSubcourses = useMemo(
    () =>
      subcourses.filter((subcourse) =>
        selectedCourse ? subcourse.course_id === selectedCourse.course_id : true
      ),
    [selectedCourse, subcourses]
  );
  const { data: selectedModules = [], isLoading: modulesLoading } = useModulesQuery(
    selectedCourse ? { course_id: selectedCourse.course_id } : undefined
  );

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{badge}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Course Catalog</h2>
            <p className="text-sm text-slate-600">Select a course to focus on its own structure and edit controls.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCourse ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCourseId(null);
                  setActiveForm(null);
                }}
              >
                Back To All Courses
              </Button>
            ) : null}
            <Button
              variant={activeForm === "course" ? "secondary" : "primary"}
              onClick={() => setActiveForm((prev) => (prev === "course" ? null : "course"))}
            >
              {activeForm === "course" ? "Close Add Course" : "Add Course"}
            </Button>
          </div>
        </div>

        {activeForm === "course" ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <CourseManagementForms
              mode="course"
              courses={courses}
              subcourses={subcourses}
              onSuccess={() => setActiveForm(null)}
            />
          </div>
        ) : null}

        {coursesLoading || subcoursesLoading ? (
          <p className="text-sm text-slate-500">Loading catalog...</p>
        ) : (
          <CourseCatalogTables
            courses={courses}
            subcourses={subcourses}
            selectedCourseId={selectedCourseId}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setActiveForm(null);
            }}
          />
        )}
      </Card>

      {selectedCourse ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Selected Course</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{selectedCourse.course_name}</h2>
              <p className="mt-2 text-sm text-slate-600">
                Work on this course only. Add the next layer you need here, then manage teaching material from each batch workspace.
              </p>
            </div>
            <div className="grid min-w-[220px] gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SubCourses</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedSubcourses.length}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Modules</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedModules.length}</p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {selectedCourse.active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              variant={activeForm === "subcourse" ? "secondary" : "primary"}
              onClick={() => setActiveForm((prev) => (prev === "subcourse" ? null : "subcourse"))}
            >
              {activeForm === "subcourse" ? "Close SubCourse Form" : "Add SubCourse"}
            </Button>
            <Button
              variant={activeForm === "module" ? "secondary" : "primary"}
              onClick={() => setActiveForm((prev) => (prev === "module" ? null : "module"))}
            >
              {activeForm === "module" ? "Close Module Form" : "Add Module"}
            </Button>
            <Button
              variant="secondary"
              disabled
            >
              Content Is Managed In Batches
            </Button>
          </div>

          {activeForm ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CourseManagementForms
                mode={activeForm}
                courses={courses}
                subcourses={selectedSubcourses}
                selectedCourseId={selectedCourse.course_id}
                onSuccess={() => setActiveForm(null)}
              />
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">SubCourses In This Course</h3>
              <DataTable
                rows={selectedSubcourses}
                rowKey={(row) => row.subcourse_id}
                initialPageSize={5}
                columns={[
                  { key: "subcourse_name", header: "SubCourse" },
                  { key: "subcourse_id", header: "SubCourse ID" },
                  { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") }
                ]}
              />
            </div>
            <div>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Modules In This Course</h3>
              {modulesLoading ? (
                <p className="text-sm text-slate-500">Loading modules...</p>
              ) : (
                <DataTable
                  rows={selectedModules}
                  rowKey={(row) => row.module_id}
                  initialPageSize={5}
                  columns={[
                    { key: "module_name", header: "Module" },
                    { key: "subcourse_id", header: "SubCourse ID" },
                    { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") }
                  ]}
                />
              )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
            Batch-specific content is no longer managed at the course level. Open a batch detail page to upload or update materials for that batch.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
