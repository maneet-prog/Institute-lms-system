"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import {
  useAssignResourceMutation,
  useBatchesQuery,
  useModulesQuery,
  useModuleContentsQuery,
  useUsersByInstituteQuery
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";

export function AssignResourceView() {
  const instituteId = useAuthStore((state) => state.instituteId);
  const { data: users = [] } = useUsersByInstituteQuery(instituteId ?? undefined);
  const { data: batches = [] } = useBatchesQuery(instituteId ?? undefined);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);

  const assignResource = useAssignResourceMutation();

  const selectedBatch = useMemo(() => batches.find((b) => b.batch_id === selectedBatchId), [batches, selectedBatchId]);

  const { data: modules = [] } = useModulesQuery(
    selectedBatch
      ? {
          course_id: selectedBatch.course_id,
          subcourse_id: selectedBatch.subcourse_id,
          institute_id: instituteId ?? undefined
        }
      : undefined
  );

  const { data: contents = [] } = useModuleContentsQuery(selectedModuleId, selectedBatchId);

  const studentOptions = useMemo(
    () => [
      { label: "Select a student", value: "" },
      ...users
        .filter((user) => user.role_names.includes("student"))
        .map((user) => ({
          label: `${user.first_name} ${user.last_name} (${user.email})`,
          value: user.user_id
        }))
    ],
    [users]
  );

  const batchOptions = useMemo(
    () => [
      { label: "Select a batch to fetch content from", value: "" },
      ...batches.map((batch) => ({ label: batch.batch_name, value: batch.batch_id }))
    ],
    [batches]
  );

  const moduleOptions = useMemo(
    () => [
      { label: "Select a module", value: "" },
      ...modules.map((m) => ({ label: m.module_name, value: m.module_id }))
    ],
    [modules]
  );

  const contentOptions = useMemo(
    () =>
      contents.map((c) => ({
        label: `${c.title} (${c.type})`,
        value: c.content_id
      })),
    [contents]
  );

  const handleAssign = () => {
    if (!selectedStudentId || !selectedContentIds.length) return;
    selectedContentIds.forEach((contentId) => {
      assignResource.mutate({ user_id: selectedStudentId, content_id: contentId });
    });
    setSelectedContentIds([]);
  };

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Resource Assignment</p>
        <h1 className="mt-2 text-2xl font-semibold">Assign Specific Exams</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a student and assign specific exams or content directly to them so it appears only in that student&apos;s workspace.
        </p>
      </Card>

      <Card>
        <div className="max-w-2xl space-y-5">
          <Select
            label="1. Target Student"
            options={studentOptions}
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          />

          {selectedStudentId ? (
            <Select
              label="2. Source Batch"
              options={batchOptions}
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedModuleId("");
                setSelectedContentIds([]);
              }}
            />
          ) : null}

          {selectedBatchId ? (
            <Select
              label="3. Source Module"
              options={moduleOptions}
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setSelectedContentIds([]);
              }}
            />
          ) : null}

          {selectedModuleId ? (
            <div className="space-y-3">
              <MultiSelect
                label="4. Select Content to Assign"
                options={contentOptions}
                value={selectedContentIds}
                onChange={setSelectedContentIds}
              />
              <div className="pt-2">
                <Button
                  onClick={handleAssign}
                  disabled={!selectedContentIds.length || assignResource.isPending}
                >
                  {assignResource.isPending ? "Assigning..." : "Assign Resources"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
