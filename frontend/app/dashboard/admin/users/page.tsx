"use client";

import { useState } from "react";

import { UserCreateForm } from "@/components/forms/UserCreateForm";
import { UsersTable } from "@/components/tables/UsersTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useInstitutesQuery, useUsersQuery } from "@/hooks/useLmsQueries";

export default function AdminUsersPage() {
  const { data: users = [], isLoading } = useUsersQuery();
  const { data: institutes = [] } = useInstitutesQuery();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Admin Management</p>
        <h1 className="mb-1 mt-2 text-2xl font-semibold">Students Info</h1>
        <p className="text-sm text-slate-600">Review student records, approvals, and institute assignments from one screen.</p>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Students List</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add Student"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <UserCreateForm
              institutes={institutes}
              defaultRoles={["student"]}
              title="Add Student"
              onSuccess={() => setShowCreate(false)}
            />
          </div>
        ) : null}
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <UsersTable users={users} roleFilter="student" title="Edit Student" />
        )}
      </Card>
    </div>
  );
}
