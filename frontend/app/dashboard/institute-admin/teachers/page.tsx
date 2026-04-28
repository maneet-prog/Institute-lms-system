"use client";

import { useState } from "react";

import { UserCreateForm } from "@/components/forms/UserCreateForm";
import { UsersTable } from "@/components/tables/UsersTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUsersByInstituteQuery } from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

export default function InstituteAdminTeachersPage() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: users = [], isLoading } = useUsersByInstituteQuery(instituteId ?? undefined);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Institute Admin: Teachers</h1>
        <p className="text-sm text-slate-600">Create, update, and review teacher records for your institute.</p>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Teachers List</h2>
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add Form" : "Add Teacher"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <UserCreateForm defaultRoles={["teacher"]} title="Add Teacher" onSuccess={() => setShowCreate(false)} />
          </div>
        ) : null}
        {isLoading ? <p>Loading teachers...</p> : <UsersTable users={users} roleFilter="teacher" title="Edit Teacher" />}
      </Card>
    </div>
  );
}
