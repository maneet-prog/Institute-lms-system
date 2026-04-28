"use client";

import { useState } from "react";

import { UserCreateForm } from "@/components/forms/UserCreateForm";
import { UsersTable } from "@/components/tables/UsersTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useUsersByInstituteQuery } from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

export default function InstituteAdminUsersPage() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: users = [], isLoading } = useUsersByInstituteQuery(instituteId ?? undefined);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="mb-1 text-2xl font-semibold">Institute Admin: Users</h1>
        <p className="text-sm text-slate-600">Approve and manage students and teachers.</p>
      </Card>
      <Card>
        <div className="flex flex-wrap gap-3">
          <Button variant={showCreate ? "secondary" : "primary"} onClick={() => setShowCreate((prev) => !prev)}>
            {showCreate ? "Close Add User" : "Add User"}
          </Button>
        </div>
        {showCreate ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <UserCreateForm defaultRoles={["student"]} title="Add User" onSuccess={() => setShowCreate(false)} />
          </div>
        ) : null}
      </Card>
      <Card>{isLoading ? <p>Loading users...</p> : <UsersTable users={users} title="Edit User" />}</Card>
    </div>
  );
}
