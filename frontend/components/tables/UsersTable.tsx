"use client";

import { useState } from "react";

import { getAssignableRoles, ROLE_LABELS } from "@/constants/roles";
import {
  useApproveUserMutation,
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useDeleteUserMutation,
  useSubCoursesByInstituteQuery,
  useInstitutesQuery,
  useUpdateUserMutation
} from "@/hooks/useLmsQueries";
import { User } from "@/types/lms";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/tables/DataTable";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/auth";

interface Props {
  users: User[];
  roleFilter?: "teacher" | "student" | "institute_admin" | "super_admin";
  title?: string;
}

export function UsersTable({
  users,
  roleFilter,
  title = "Manage User Access"
}: Props) {
  const approveUser = useApproveUserMutation();
  const updateUser = useUpdateUserMutation();
  const deleteUser = useDeleteUserMutation();
  const { data: institutes = [] } = useInstitutesQuery();
  const role = useAuthStore((state) => state.role);
  const assignableRoles = getAssignableRoles(role);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [approvalUser, setApprovalUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mob_no: "",
    is_approved: false,
    active: true,
    institute_id: "",
    role_name: "student",
    course_id: "",
    subcourse_id: "",
    batch_id: ""
  });
  const [approvalForm, setApprovalForm] = useState({
    course_id: "",
    subcourse_id: "",
    batch_id: ""
  });

  const assignmentInstituteId = selectedUser?.institute_id ?? "";
  const approvalInstituteId = approvalUser?.institute_id ?? "";
  const { data: editCourses = [] } = useCoursesByInstituteQuery(assignmentInstituteId || undefined);
  const { data: editSubcourses = [] } = useSubCoursesByInstituteQuery(
    assignmentInstituteId
      ? { institute_id: assignmentInstituteId, course_id: form.course_id || undefined }
      : undefined
  );
  const { data: editBatches = [] } = useBatchesQuery(assignmentInstituteId || undefined);
  const { data: approvalCourses = [] } = useCoursesByInstituteQuery(approvalInstituteId || undefined);
  const { data: approvalSubcourses = [] } = useSubCoursesByInstituteQuery(
    approvalInstituteId
      ? { institute_id: approvalInstituteId, course_id: approvalForm.course_id || undefined }
      : undefined
  );
  const { data: approvalBatches = [] } = useBatchesQuery(approvalInstituteId || undefined);

  const rows = roleFilter
    ? users.filter((user) => user.role_names.includes(roleFilter))
    : users;

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mob_no: user.mob_no,
      is_approved: user.is_approved,
      active: user.active,
      institute_id: user.institute_id,
      role_name: user.role_names.find((roleName) => assignableRoles.includes(roleName as never)) ?? "student",
      course_id: user.assigned_batches?.[0]?.course_id ?? user.selected_courses?.[0]?.course_id ?? "",
      subcourse_id: user.assigned_batches?.[0]?.subcourse_id ?? user.selected_courses?.[0]?.subcourse_id ?? "",
      batch_id: user.assigned_batches?.[0]?.batch_id ?? ""
    });
  };

  const openApproval = (user: User) => {
    setApprovalUser(user);
    setApprovalForm({
      course_id: user.selected_courses?.[0]?.course_id ?? user.assigned_batches?.[0]?.course_id ?? "",
      subcourse_id: user.selected_courses?.[0]?.subcourse_id ?? user.assigned_batches?.[0]?.subcourse_id ?? "",
      batch_id: user.assigned_batches?.[0]?.batch_id ?? ""
    });
  };

  return (
    <>
      <DataTable
        rows={rows}
        rowKey={(user) => user.user_id}
        columns={[
          { key: "first_name", header: "First Name" },
          { key: "last_name", header: "Last Name" },
          { key: "email", header: "Email" },
          { key: "institute_name", header: "Institute" },
          { key: "role_names", header: "Roles", render: (user) => user.role_names.join(", ") || "-" },
          { key: "is_approved", header: "Approved", render: (user) => (user.is_approved ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (user) => (
              <div className="flex flex-wrap gap-2">
                {!user.is_approved ? (
                  <Button
                    onClick={() => openApproval(user)}
                    disabled={approveUser.isPending}
                  >
                    Approve
                  </Button>
                ) : null}
                <Button variant="secondary" onClick={() => openEdit(user)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete user "${user.first_name} ${user.last_name}"?`)) {
                      deleteUser.mutate(user.user_id);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal title={title} open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        <div className="space-y-3">
          <Input
            label="First Name"
            value={form.first_name}
            onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
          />
          <Input
            label="Last Name"
            value={form.last_name}
            onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Mobile"
            value={form.mob_no}
            onChange={(event) => setForm((prev) => ({ ...prev, mob_no: event.target.value }))}
          />
          <Input label="Institute" value={institutes.find((item) => item.institute_id === form.institute_id)?.name ?? selectedUser?.institute_name ?? ""} disabled />
          <Select
            label="Role"
            options={assignableRoles.map((assignableRole) => ({
              label: ROLE_LABELS[assignableRole],
              value: assignableRole
            }))}
            value={form.role_name}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                role_name: event.target.value,
                batch_id: ""
              }))
            }
          />
          {(form.role_name === "student" || form.role_name === "teacher") ? (
            <>
              <Select
                label="Course"
                options={[{ label: "Select course", value: "" }, ...editCourses.map((course) => ({ label: course.course_name, value: course.course_id }))]}
                value={form.course_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    course_id: event.target.value,
                    subcourse_id: "",
                    batch_id: ""
                  }))
                }
              />
              <Select
                label="SubCourse"
                options={[{ label: "Select subcourse", value: "" }, ...editSubcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))]}
                value={form.subcourse_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    subcourse_id: event.target.value,
                    batch_id: ""
                  }))
                }
                disabled={!form.course_id}
              />
              <Select
                label="Batch"
                options={[
                  { label: "Select batch", value: "" },
                  ...editBatches
                    .filter(
                      (batch) =>
                        (!form.course_id || batch.course_id === form.course_id) &&
                        (!form.subcourse_id || batch.subcourse_id === form.subcourse_id)
                    )
                    .map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
                ]}
                value={form.batch_id}
                onChange={(event) => setForm((prev) => ({ ...prev, batch_id: event.target.value }))}
                disabled={!form.course_id || !form.subcourse_id}
              />
            </>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_approved}
              onChange={(event) => setForm((prev) => ({ ...prev, is_approved: event.target.checked }))}
            />
            Approved
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedUser) {
                  return;
                }
                updateUser.mutate(
                  {
                    userId: selectedUser.user_id,
                    payload: {
                      first_name: form.first_name,
                      last_name: form.last_name,
                      email: form.email,
                      mob_no: form.mob_no,
                      course_id: form.course_id || undefined,
                      subcourse_id: form.subcourse_id || undefined,
                      batch_id: form.batch_id || undefined,
                      is_approved: form.is_approved,
                      active: form.active,
                      role_names: [form.role_name]
                    }
                  },
                  {
                    onSuccess: () => setSelectedUser(null)
                  }
                );
              }}
              disabled={updateUser.isPending}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Approve User" open={Boolean(approvalUser)} onClose={() => setApprovalUser(null)}>
        <div className="space-y-3">
          <Input
            label="User"
            value={approvalUser ? `${approvalUser.first_name} ${approvalUser.last_name}` : ""}
            disabled
          />
          <Select
            label="Course"
            options={[{ label: "Select course", value: "" }, ...approvalCourses.map((course) => ({ label: course.course_name, value: course.course_id }))]}
            value={approvalForm.course_id}
            onChange={(event) =>
              setApprovalForm((prev) => ({
                ...prev,
                course_id: event.target.value,
                subcourse_id: "",
                batch_id: ""
              }))
            }
          />
          <Select
            label="SubCourse"
            options={[{ label: "Select subcourse", value: "" }, ...approvalSubcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))]}
            value={approvalForm.subcourse_id}
            onChange={(event) =>
              setApprovalForm((prev) => ({
                ...prev,
                subcourse_id: event.target.value,
                batch_id: ""
              }))
            }
            disabled={!approvalForm.course_id}
          />
          <Select
            label="Batch"
            options={[
              { label: "Select batch", value: "" },
              ...approvalBatches
                .filter(
                  (batch) =>
                    (!approvalForm.course_id || batch.course_id === approvalForm.course_id) &&
                    (!approvalForm.subcourse_id || batch.subcourse_id === approvalForm.subcourse_id)
                )
                .map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
            ]}
            value={approvalForm.batch_id}
            onChange={(event) => setApprovalForm((prev) => ({ ...prev, batch_id: event.target.value }))}
            disabled={!approvalForm.course_id || !approvalForm.subcourse_id}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!approvalUser) return;
                approveUser.mutate(
                  {
                    userId: approvalUser.user_id,
                    payload: {
                      approve: true,
                      course_id: approvalForm.course_id || undefined,
                      subcourse_id: approvalForm.subcourse_id || undefined,
                      batch_id: approvalForm.batch_id || undefined
                    }
                  },
                  {
                    onSuccess: () => setApprovalUser(null)
                  }
                );
              }}
              disabled={
                approveUser.isPending ||
                ((approvalUser?.role_names.includes("student") || approvalUser?.role_names.includes("teacher")) &&
                  !approvalForm.batch_id)
              }
            >
              Approve
            </Button>
            <Button variant="secondary" onClick={() => setApprovalUser(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
