"use client";

import { Module, User } from "@/types/lms";
import {
  useModuleContentsQuery,
  useUpdateStudentContentAccessMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

function StudentContentAccessSection({
  batchId,
  instituteId,
  module,
  student
}: {
  batchId: string;
  instituteId?: string;
  module: Module;
  student: User;
}) {
  const { data: contents = [], isLoading } = useModuleContentsQuery(module.module_id, batchId);
  const updateAccess = useUpdateStudentContentAccessMutation();

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading {module.module_name} content...</p>;
  }

  if (!contents.length) {
    return (
      <Card className="border-slate-200">
        <p className="text-sm font-semibold text-slate-900">{module.module_name}</p>
        <p className="mt-2 text-sm text-slate-500">No content has been added to this module yet.</p>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <p className="text-sm font-semibold text-slate-900">{module.module_name}</p>
      <div className="mt-3 space-y-3">
        {contents.map((content) => {
          const isSelectedStudentsMode = content.visibility_scope === "selected_students";
          const hasDirectAccess = (content.assigned_student_ids || []).includes(student.user_id);
          const isHiddenFromStudent = (content.hidden_student_ids || []).includes(student.user_id);
          const hasAccess = isSelectedStudentsMode ? hasDirectAccess : !isHiddenFromStudent;
          const actionLabel = isSelectedStudentsMode
            ? hasAccess
              ? "Remove Content"
              : "Add Content"
            : hasAccess
              ? "Hide Content"
              : "Show Content";
          const badgeLabel = isSelectedStudentsMode
            ? hasAccess
              ? "Assigned"
              : "Not assigned"
            : hasAccess
              ? "Visible"
              : "Hidden";

          return (
            <div key={content.content_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{content.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-600">
                    {content.type} | {isSelectedStudentsMode ? "selected students" : "batch content"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  {badgeLabel}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={hasAccess ? "danger" : "secondary"}
                  disabled={updateAccess.isPending}
                  onClick={() =>
                    updateAccess.mutate({
                      contentId: content.content_id,
                      payload: {
                        student_id: student.user_id,
                        access_mode: hasAccess ? "revoke" : "grant",
                        institute_id: instituteId
                      }
                    })
                  }
                >
                  {actionLabel}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function StudentContentAccessModal({
  open,
  onClose,
  batchId,
  instituteId,
  student,
  modules
}: {
  open: boolean;
  onClose: () => void;
  batchId: string;
  instituteId?: string;
  student: User | null;
  modules: Module[];
}) {
  return (
    <Modal
      title={
        student
          ? `Manage Content Access: ${student.first_name} ${student.last_name}`
          : "Manage Content Access"
      }
      open={open}
      onClose={onClose}
    >
      {student ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Add or remove student-specific content, and hide or show batch content for this student.
          </p>
          {modules.length ? (
            modules.map((module) => (
              <StudentContentAccessSection
                key={module.module_id}
                batchId={batchId}
                instituteId={instituteId}
                module={module}
                student={student}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500">Create modules first, then manage access content-by-content.</p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
