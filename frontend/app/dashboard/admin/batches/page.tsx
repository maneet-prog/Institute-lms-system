"use client";

import { useState } from "react";

import { BatchManagementForms } from "@/components/forms/BatchManagementForms";
import { BatchCatalogTable } from "@/components/tables/BatchCatalogTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useBatchesQuery, useCoursesQuery, useSubCoursesQuery } from "@/hooks/useLmsQueries";

export default function AdminBatchesPage() {
  const { data: batches = [], isLoading } = useBatchesQuery();
  const { data: courses = [] } = useCoursesQuery();
  const { data: subcourses = [] } = useSubCoursesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Admin Management</p>
        <h1 className="mb-1 mt-2 text-2xl font-semibold">Batches</h1>
        <p className="text-sm text-slate-600">
          Manage batches, teacher assignments, and student assignments across institutes.
        </p>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Batch Management</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add / Assign"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <BatchManagementForms allowInstituteSelect />
          </div>
        ) : null}
        {isLoading ? (
          <p>Loading batches...</p>
        ) : (
          <BatchCatalogTable
            batches={batches}
            courses={courses}
            subcourses={subcourses}
            detailBasePath="/dashboard/admin/batches"
          />
        )}
      </Card>
    </div>
  );
}
