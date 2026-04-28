"use client";

import { FormEvent, useMemo, useState } from "react";

import { Institute } from "@/types/lms";
import { getAssignableRoles, ROLE_LABELS } from "@/constants/roles";
import {
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useCreateUserMutation,
  useSubCoursesByInstituteQuery
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface Props {
  institutes?: Institute[];
  defaultRoles?: string[];
  title?: string;
  onSuccess?: () => void;
}

export function UserCreateForm({
  institutes = [],
  defaultRoles = ["student"],
  title = "Add User",
  onSuccess
}: Props) {
  const createUser = useCreateUserMutation();
  const role = useAuthStore((state) => state.role);
  const userInstituteId = useAuthStore((state) => state.instituteId);
  const assignableRoles = getAssignableRoles(role);
  const initialRole = defaultRoles[0] ?? assignableRoles[0] ?? "student";

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mob_no: "",
    password: "",
    is_approved: true,
    active: true,
    institute_id: userInstituteId ?? "",
    role_name: initialRole,
    course_id: "",
    subcourse_id: "",
    batch_id: ""
  });

  const effectiveInstituteId = role === "super_admin" ? form.institute_id : userInstituteId ?? "";
  const shouldShowBatchFields = form.role_name === "student" || form.role_name === "teacher";
  const { data: courses = [] } = useCoursesByInstituteQuery(effectiveInstituteId || undefined);
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery(
    effectiveInstituteId
      ? {
          institute_id: effectiveInstituteId,
          course_id: form.course_id || undefined
        }
      : undefined
  );
  const { data: batches = [] } = useBatchesQuery(effectiveInstituteId || undefined);

  const instituteOptions = useMemo(
    () => [{ label: "Select institute", value: "" }, ...institutes.map((institute) => ({ label: institute.name, value: institute.institute_id }))],
    [institutes]
  );
  const courseOptions = useMemo(
    () => [{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))],
    [courses]
  );
  const subcourseOptions = useMemo(
    () => [{ label: "Select subcourse", value: "" }, ...subcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))],
    [subcourses]
  );
  const batchOptions = useMemo(
    () => [
      { label: "Select batch", value: "" },
      ...batches
        .filter(
          (batch) =>
            (!form.course_id || batch.course_id === form.course_id) &&
            (!form.subcourse_id || batch.subcourse_id === form.subcourse_id)
        )
        .map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
    ],
    [batches, form.course_id, form.subcourse_id]
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createUser.mutate(
      {
        ...form,
        institute_id: role === "super_admin" ? form.institute_id || undefined : userInstituteId || undefined,
        role_names: [form.role_name]
      },
      {
        onSuccess: () => {
          setForm({
            first_name: "",
            last_name: "",
            email: "",
            mob_no: "",
            password: "",
            is_approved: true,
            active: true,
            institute_id: userInstituteId ?? "",
            role_name: initialRole,
            course_id: "",
            subcourse_id: "",
            batch_id: ""
          });
          onSuccess?.();
        }
      }
    );
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <Input label="First Name" required value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} />
      <Input label="Last Name" required value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} />
      <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
      <Input label="Mobile" required value={form.mob_no} onChange={(e) => setForm((prev) => ({ ...prev, mob_no: e.target.value }))} />
      <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} />
      <Select
        label="Role"
        options={assignableRoles.map((assignableRole) => ({
          label: ROLE_LABELS[assignableRole],
          value: assignableRole
        }))}
        value={form.role_name}
        onChange={(e) => setForm((prev) => ({ ...prev, role_name: e.target.value }))}
        required
      />
      {role === "super_admin" ? (
        <Select
          label="Institute"
          options={instituteOptions}
          value={form.institute_id}
          onChange={(e) => setForm((prev) => ({ ...prev, institute_id: e.target.value }))}
          required
        />
      ) : null}
      {shouldShowBatchFields ? (
        <>
          <Select
            label="Course"
            options={courseOptions}
            value={form.course_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                course_id: e.target.value,
                subcourse_id: "",
                batch_id: ""
              }))
            }
          />
          <Select
            label="SubCourse"
            options={subcourseOptions}
            value={form.subcourse_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                subcourse_id: e.target.value,
                batch_id: ""
              }))
            }
            disabled={!form.course_id}
          />
          <Select
            label="Batch"
            options={batchOptions}
            value={form.batch_id}
            onChange={(e) => setForm((prev) => ({ ...prev, batch_id: e.target.value }))}
            disabled={!form.course_id || !form.subcourse_id}
          />
        </>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.is_approved} onChange={(e) => setForm((prev) => ({ ...prev, is_approved: e.target.checked }))} />
        Approved
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
        Active
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? "Saving..." : title}
        </Button>
      </div>
    </form>
  );
}
