"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  useBatchesQuery,
  useAssignUserToBatchMutation,
  useRemoveUserFromBatchMutation
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Plus, X, Users, GraduationCap, Calendar } from "lucide-react";

interface UserBatchesTabProps {
  userId: string;
  batches: {
    assigned: Array<{
      id: string;
      batch_id: string;
      batch_name: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      assigned_at: string;
    }>;
    teaching: Array<{
      id: string;
      batch_id: string;
      batch_name: string;
      course_id: string;
      course_name: string;
      subcourse_id: string;
      subcourse_name: string;
      assigned_at: string;
    }>;
  };
}

export function UserBatchesTab({ userId, batches }: UserBatchesTabProps) {
  const instituteId = useAuthStore((state) => state.instituteId);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher">("student");

  const { data: availableBatches = [] } = useBatchesQuery(instituteId ?? undefined);
  const assignToBatch = useAssignUserToBatchMutation();
  const removeFromBatch = useRemoveUserFromBatchMutation();

  const handleAssign = async () => {
    if (!selectedBatchId) return;

    try {
      await assignToBatch.mutateAsync({
        userId,
        batch_id: selectedBatchId,
        role: selectedRole
      });
      setShowAssignModal(false);
      setSelectedBatchId("");
      setSelectedRole("student");
    } catch (error) {
      console.error("Failed to assign user to batch:", error);
    }
  };

  const handleRemove = async (assignmentId: string, type: "assigned" | "teaching") => {
    const message = type === "teaching"
      ? "Are you sure you want to remove this teacher from the batch?"
      : "Are you sure you want to remove this student from the batch?";

    if (confirm(message)) {
      try {
        await removeFromBatch.mutateAsync({
          userId,
          batchAssignmentId: assignmentId
        });
      } catch (error) {
        console.error("Failed to remove from batch:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Assign Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAssignModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign to Batch
        </Button>
      </div>

      {/* Teaching Batches */}
      {batches.teaching.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Teaching Batches
          </h3>
          <div className="grid gap-4">
            {batches.teaching.map((assignment) => (
              <Card key={assignment.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{assignment.batch_name}</h4>
                    <p className="text-sm text-gray-600">
                      {assignment.course_name} - {assignment.subcourse_name}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                      <Badge variant="default">Teacher</Badge>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleRemove(assignment.id, "teaching")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Batches (Student) */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Assigned Batches {batches.teaching.length > 0 ? "(Student)" : ""}
        </h3>
        {batches.assigned.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No assigned batches</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {batches.assigned.map((assignment) => (
              <Card key={assignment.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{assignment.batch_name}</h4>
                    <p className="text-sm text-gray-600">
                      {assignment.course_name} - {assignment.subcourse_name}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary">Student</Badge>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleRemove(assignment.id, "assigned")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign User to Batch"
      >
        <div className="space-y-4">
          <Select
            label="Batch"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            options={availableBatches.map(batch => ({
              value: batch.batch_id,
              label: `${batch.batch_name} (${batch.course_id} - ${batch.subcourse_id})`
            }))}
          />

          <Select
            label="Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "student" | "teacher")}
            options={[
              { value: "student", label: "Student" },
              { value: "teacher", label: "Teacher" }
            ]}
          />

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedBatchId || assignToBatch.isPending}
            >
              {assignToBatch.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}