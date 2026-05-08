"use client";

import { AppLink } from "@/components/navigation/AppLink";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { useBatchesQuery, useCoursesQuery, useSubCoursesQuery } from "@/hooks/useLmsQueries";

export default function TeacherBatchesPage() {
  const { data: batches = [], isLoading } = useBatchesQuery();
  const { data: courses = [] } = useCoursesQuery();
  const { data: subcourses = [] } = useSubCoursesQuery();

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Teacher: Assigned Batches</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use institute admin assignments to see and manage only your own batches.
        </p>
      </Card>
      <Card>
        {isLoading ? (
          <p>Loading batches...</p>
        ) : (
          <DataTable
            rows={batches}
            rowKey={(row) => row.batch_id}
            columns={[
              { key: "batch_name", header: "Batch" },
              {
                key: "course_name",
                header: "Course",
                render: (row) => courses.find((course) => course.course_id === row.course_id)?.course_name ?? "Mapped course",
                getFilterValue: (row) => courses.find((course) => course.course_id === row.course_id)?.course_name ?? ""
              },
              {
                key: "subcourse_name",
                header: "SubCourse",
                render: (row) => subcourses.find((subcourse) => subcourse.subcourse_id === row.subcourse_id)?.subcourse_name ?? "Mapped subcourse",
                getFilterValue: (row) => subcourses.find((subcourse) => subcourse.subcourse_id === row.subcourse_id)?.subcourse_name ?? ""
              },
              { key: "active", header: "Active" },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <AppLink href={`/dashboard/teacher/batches/${row.batch_id}`} className="font-medium text-brand-700 hover:underline">
                    Open Batch
                  </AppLink>
                )
              }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
