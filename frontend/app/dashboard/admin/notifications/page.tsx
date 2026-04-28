"use client";

import { useMemo, useState } from "react";

import { assignInstitute } from "@/services/users";
import {
  useApproveUserMutation,
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useInstitutesQuery,
  useSubCoursesByInstituteQuery,
  useUsersQuery
} from "@/hooks/useLmsQueries";
import { User } from "@/types/lms";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/tables/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

export default function AdminNotificationsPage() {
  const { data: users = [] } = useUsersQuery();
  const { data: institutes = [] } = useInstitutesQuery();
  const approveUser = useApproveUserMutation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInstituteId, setSelectedInstituteId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubcourseId, setSelectedSubcourseId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const { data: batches = [] } = useBatchesQuery(selectedInstituteId || undefined);
  const { data: courses = [] } = useCoursesByInstituteQuery(selectedInstituteId || undefined);
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery(
    selectedInstituteId
      ? { institute_id: selectedInstituteId, course_id: selectedCourseId || undefined }
      : undefined
  );

  const pendingUsers = useMemo(() => users.filter((user) => !user.is_approved), [users]);
  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          (!selectedCourseId || batch.course_id === selectedCourseId) &&
          (!selectedSubcourseId || batch.subcourse_id === selectedSubcourseId)
      ),
    [batches, selectedCourseId, selectedSubcourseId]
  );

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review new registrations, assign institute and batch, then approve the user.
        </p>
      </Card>
      <Card>
        <DataTable
          rows={pendingUsers}
          rowKey={(row) => row.user_id}
          columns={[
            { key: "first_name", header: "First Name" },
            { key: "last_name", header: "Last Name" },
            { key: "email", header: "Email" },
            { key: "created_at", header: "Registered At" },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedUser(row);
                    setSelectedInstituteId(row.institute_id);
                    setSelectedCourseId(row.selected_courses?.[0]?.course_id ?? "");
                    setSelectedSubcourseId(row.selected_courses?.[0]?.subcourse_id ?? "");
                    setSelectedBatchId("");
                  }}
                >
                  Review
                </Button>
              )
            }
          ]}
        />
      </Card>

      <Modal title="Registration Details" open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        {selectedUser ? (
          <div className="space-y-4">
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>Name:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Mobile:</strong> {selectedUser.mob_no}</p>
              <p><strong>Selected Course:</strong> {selectedUser.selected_courses?.[0]?.course_name ?? "-"}</p>
              <p><strong>Selected SubCourse:</strong> {selectedUser.selected_courses?.[0]?.subcourse_name ?? "-"}</p>
            </div>
            <Select
              label="Institute"
              options={[
                { label: "Select institute", value: "" },
                ...institutes.map((institute) => ({ label: institute.name, value: institute.institute_id }))
              ]}
              value={selectedInstituteId}
              onChange={(e) => {
                setSelectedInstituteId(e.target.value);
                setSelectedCourseId("");
                setSelectedSubcourseId("");
                setSelectedBatchId("");
              }}
            />
            <Select
              label="Course"
              options={[
                { label: "Select course", value: "" },
                ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
              ]}
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedSubcourseId("");
                setSelectedBatchId("");
              }}
            />
            <Select
              label="SubCourse"
              options={[
                { label: "Select subcourse", value: "" },
                ...subcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))
              ]}
              value={selectedSubcourseId}
              onChange={(e) => {
                setSelectedSubcourseId(e.target.value);
                setSelectedBatchId("");
              }}
              disabled={!selectedCourseId}
            />
            <Select
              label="Batch"
              options={[
                { label: "Select batch", value: "" },
                ...filteredBatches.map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
              ]}
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={!selectedCourseId || !selectedSubcourseId}
            />
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!selectedInstituteId || !selectedBatchId) return;
                  await assignInstitute(selectedUser.user_id, selectedInstituteId);
                  await approveUser.mutateAsync({
                    userId: selectedUser.user_id,
                    payload: {
                      approve: true,
                      course_id: selectedCourseId || undefined,
                      subcourse_id: selectedSubcourseId || undefined,
                      batch_id: selectedBatchId
                    }
                  });
                  setSelectedUser(null);
                }}
              >
                Approve and Assign
              </Button>
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
