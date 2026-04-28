"use client";

import { useState } from "react";

import { InstituteForm } from "@/components/forms/InstituteForm";
import { InstitutesTable } from "@/components/tables/InstitutesTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useInstitutesQuery } from "@/hooks/useLmsQueries";

export default function AdminInstitutesPage() {
  const { data: institutes = [], isLoading } = useInstitutesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Admin Management</p>
        <h1 className="mb-1 mt-2 text-2xl font-semibold">Institute Info</h1>
        <p className="text-sm text-slate-600">Create and review tenant institutes from the admin sidebar.</p>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Institute List</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add Institute"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <InstituteForm />
          </div>
        ) : null}
        {isLoading ? <p>Loading...</p> : <InstitutesTable institutes={institutes} />}
      </Card>
    </div>
  );
}
