"use client";

import { useMemo, useState } from "react";

import { CourseManagementForms } from "@/components/forms/CourseManagementForms";
import { ModuleContentList } from "@/components/content/ModuleContentList";
import { DataTable } from "@/components/tables/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Select } from "@/components/ui/Select";
import {
  useAssignStudentBatchMutation,
  useAssignTeacherMutation,
  useBatchDetailQuery,
  useModulesQuery,
  useRemoveStudentBatchMutation,
  useRemoveTeacherMutation,
  useUsersByInstituteQuery
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

interface Props {
  batchId: string;
  instituteId?: string;
  badge: string;
}

type BatchActionPanel = "module" | "content" | null;

export function BatchDetailWorkspace({ batchId, instituteId, badge }: Props) {
  const role = useAuthStore((state) => state.role);
  const authInstituteId = useAuthStore((state) => state.instituteId);
  const effectiveInstituteId = instituteId ?? authInstituteId ?? undefined;
  const canAssignPeople = role === "super_admin" || role === "institute_admin";
  const canManageContent = role !== "student";

  const { data, isLoading } = useBatchDetailQuery(batchId, effectiveInstituteId);
  const [activePanel, setActivePanel] = useState<BatchActionPanel>(null);
  const [teacherUserId, setTeacherUserId] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);

  const assignTeacher = useAssignTeacherMutation();
  const assignStudent = useAssignStudentBatchMutation();
  const removeTeacher = useRemoveTeacherMutation();
  const removeStudent = useRemoveStudentBatchMutation();

  const { data: modules = [] } = useModulesQuery(
    data
      ? {
          course_id: data.course.course_id,
          subcourse_id: data.subcourse.subcourse_id,
          institute_id: effectiveInstituteId
        }
      : undefined
  );
  const { data: users = [] } = useUsersByInstituteQuery(
    canAssignPeople ? effectiveInstituteId : undefined,
    { enabled: canAssignPeople }
  );

  const teacherOptions = useMemo(() => {
    if (!canAssignPeople || !data) return [];
    const assignedIds = new Set(data.teachers.map((teacher) => teacher.user_id));
    return users
      .filter((user) => user.active && user.role_names.includes("teacher"))
      .filter((user) => !assignedIds.has(user.user_id))
      .map((user) => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.user_id
      }));
  }, [canAssignPeople, data, users]);

  const studentOptions = useMemo(() => {
    if (!canAssignPeople || !data) return [];
    const assignedIds = new Set(data.students.map((student) => student.user_id));
    return users
      .filter((user) => user.active && user.role_names.includes("student"))
      .filter((user) => !assignedIds.has(user.user_id))
      .map((user) => ({
        label: `${user.first_name} ${user.last_name}`,
        value: user.user_id
      }));
  }, [canAssignPeople, data, users]);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading batch details...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-600">Batch not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">{badge}</p>
        <h1 className="mt-2 text-2xl font-semibold">{data.batch_name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage this batch as one teaching workspace, including its course path, content, teachers, and students.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Course</h2>
          <p className="mt-3 text-sm text-slate-700">{data.course.course_name}</p>
          <p className="text-xs text-slate-500">{data.course.course_id}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">SubCourse</h2>
          <p className="mt-3 text-sm text-slate-700">{data.subcourse.subcourse_name}</p>
          <p className="text-xs text-slate-500">{data.subcourse.subcourse_id}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Batch Details</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>Room / Branch: {data.room_name || "-"}</p>
            <p>Start Date: {data.start_date || "-"}</p>
            <p>End Date: {data.end_date || "-"}</p>
            <p>Schedule: {data.schedule_notes || "-"}</p>
            <p>Description: {data.description || "-"}</p>
          </div>
        </Card>
      </div>

      {canManageContent ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Batch Learning Controls</h2>
              <p className="text-sm text-slate-600">
                Add modules and content directly inside this batch course path.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activePanel === "module" ? "secondary" : "primary"}
                onClick={() => setActivePanel((prev) => (prev === "module" ? null : "module"))}
              >
                {activePanel === "module" ? "Close Module Form" : "Add Module"}
              </Button>
              <Button
                variant={activePanel === "content" ? "secondary" : "primary"}
                onClick={() => setActivePanel((prev) => (prev === "content" ? null : "content"))}
              >
                {activePanel === "content" ? "Close Content Form" : "Add Content"}
              </Button>
            </div>
          </div>

          {activePanel ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <CourseManagementForms
                mode={activePanel}
                courses={[
                  {
                    course_id: data.course.course_id,
                    course_name: data.course.course_name,
                    institute_id: effectiveInstituteId ?? "",
                    active: true
                  }
                ]}
                subcourses={[
                  {
                    subcourse_id: data.subcourse.subcourse_id,
                    subcourse_name: data.subcourse.subcourse_name,
                    course_id: data.course.course_id,
                    institute_id: effectiveInstituteId ?? "",
                    active: true
                  }
                ]}
                selectedCourseId={data.course.course_id}
                selectedSubcourseId={data.subcourse.subcourse_id}
                batchId={data.batch_id}
                instituteId={effectiveInstituteId}
                disableCoursePathSelection
                onSuccess={() => setActivePanel(null)}
              />
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold">Batch Modules & Content</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review every module and its content inside this batch path.
        </p>
        <div className="mt-4">
          <DataTable
            rows={modules}
            rowKey={(row) => row.module_id}
            initialPageSize={5}
            columns={[
              { key: "module_name", header: "Module" },
              { key: "module_id", header: "Module ID" },
              { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") }
            ]}
          />
        </div>

        {modules.length ? (
          <div className="mt-6 space-y-4">
            {modules.map((module) => (
              <div key={module.module_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3">
                  <p className="text-base font-semibold text-slate-900">{module.module_name}</p>
                  <p className="text-sm text-slate-500">Module ID: {module.module_id}</p>
                </div>
                <ModuleContentList
                  moduleId={module.module_id}
                  batchId={data.batch_id}
                  canManage={role === "super_admin" || role === "institute_admin" || role === "teacher"}
                />
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Teachers</h2>
            <span className="text-sm text-slate-500">{data.teachers.length} assigned</span>
          </div>
          {canAssignPeople ? (
            <form
              className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!teacherUserId) return;
                assignTeacher.mutate(
                  {
                    batch_id: data.batch_id,
                    user_id: teacherUserId,
                    institute_id: effectiveInstituteId
                  },
                  {
                    onSuccess: () => setTeacherUserId("")
                  }
                );
              }}
            >
              <div className="min-w-[260px] flex-1">
                <Select
                  label="Assign Teacher"
                  options={[{ label: "Select teacher", value: "" }, ...teacherOptions]}
                  value={teacherUserId}
                  onChange={(event) => setTeacherUserId(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={assignTeacher.isPending || !teacherUserId}>
                Add Teacher
              </Button>
            </form>
          ) : null}
          <div className="mt-4">
            <DataTable
              rows={data.teachers}
              rowKey={(row) => row.user_id}
              initialPageSize={5}
              columns={[
                { key: "first_name", header: "First Name" },
                { key: "last_name", header: "Last Name" },
                { key: "email", header: "Email" },
                { key: "mob_no", header: "Mobile" },
                { key: "is_approved", header: "Approved", render: (row) => (row.is_approved ? "Yes" : "No") },
                canAssignPeople
                  ? {
                      key: "actions",
                      header: "Actions",
                      render: (row) => (
                        <Button
                          variant="danger"
                          onClick={() =>
                            removeTeacher.mutate({
                              batch_id: data.batch_id,
                              user_id: row.user_id,
                              institute_id: effectiveInstituteId
                            })
                          }
                          disabled={removeTeacher.isPending}
                        >
                          Remove
                        </Button>
                      )
                    }
                  : { key: "actions", header: "Actions", render: () => "-" }
              ]}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Students</h2>
            <span className="text-sm text-slate-500">{data.students.length} assigned</span>
          </div>
          {canAssignPeople ? (
            <form
              className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                studentIds.forEach((studentId) => {
                  assignStudent.mutate({
                    batch_id: data.batch_id,
                    user_id: studentId,
                    institute_id: effectiveInstituteId
                  });
                });
                setStudentIds([]);
              }}
            >
              <MultiSelect
                label="Assign Students"
                options={studentOptions}
                value={studentIds}
                onChange={setStudentIds}
              />
              <Button type="submit" disabled={assignStudent.isPending || !studentIds.length}>
                Add Students
              </Button>
            </form>
          ) : null}
          <div className="mt-4">
            <DataTable
              rows={data.students}
              rowKey={(row) => row.user_id}
              initialPageSize={10}
              columns={[
                { key: "first_name", header: "First Name" },
                { key: "last_name", header: "Last Name" },
                { key: "email", header: "Email" },
                { key: "mob_no", header: "Mobile" },
                { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
                { key: "is_approved", header: "Approved", render: (row) => (row.is_approved ? "Yes" : "No") },
                canAssignPeople
                  ? {
                      key: "actions",
                      header: "Actions",
                      render: (row) => (
                        <Button
                          variant="danger"
                          onClick={() =>
                            removeStudent.mutate({
                              batch_id: data.batch_id,
                              user_id: row.user_id,
                              institute_id: effectiveInstituteId
                            })
                          }
                          disabled={removeStudent.isPending}
                        >
                          Remove
                        </Button>
                      )
                    }
                  : { key: "actions", header: "Actions", render: () => "-" }
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
