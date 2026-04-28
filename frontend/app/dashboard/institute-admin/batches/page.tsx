"use client";

import { useState } from "react";

import { BatchManagementForms } from "@/components/forms/BatchManagementForms";
import { BatchCatalogTable } from "@/components/tables/BatchCatalogTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useSubCoursesByInstituteQuery
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

export default function InstituteAdminBatchesPage() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: batches = [], isLoading } = useBatchesQuery();
  const { data: courses = [] } = useCoursesByInstituteQuery(instituteId ?? undefined);
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery(
    instituteId ? { institute_id: instituteId } : undefined
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Institute Admin: Batches</h1>
        <p className="text-sm text-slate-600">
          Review all available batches first, then add, update, assign, or open a batch to manage details and content.
        </p>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Available Batches</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add Batch"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <BatchManagementForms />
          </div>
        ) : null}
        {isLoading ? (
          <p>Loading batches...</p>
        ) : (
          <BatchCatalogTable
            batches={batches}
            courses={courses}
            subcourses={subcourses}
            detailBasePath="/dashboard/institute-admin/batches"
          />
        )}
      </Card>
    </div>
  );
}
