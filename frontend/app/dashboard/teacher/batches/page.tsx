"use client";

import { AppLink } from "@/components/navigation/AppLink";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { useBatchesQuery } from "@/hooks/useLmsQueries";

export default function TeacherBatchesPage() {
  const { data: batches = [], isLoading } = useBatchesQuery();

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
              { key: "course_id", header: "Course ID" },
              { key: "subcourse_id", header: "SubCourse ID" },
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
