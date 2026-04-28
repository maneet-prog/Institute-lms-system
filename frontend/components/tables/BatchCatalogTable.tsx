"use client";

import { useMemo, useState } from "react";

import { AppLink } from "@/components/navigation/AppLink";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useDeleteBatchMutation, useUpdateBatchMutation } from "@/hooks/useLmsQueries";
import { Batch, Course, SubCourse } from "@/types/lms";

interface Props {
  batches: Batch[];
  courses: Course[];
  subcourses: SubCourse[];
  detailBasePath: string;
  instituteId?: string;
}

export function BatchCatalogTable({ batches, courses, subcourses, detailBasePath, instituteId }: Props) {
  const updateBatch = useUpdateBatchMutation();
  const deleteBatch = useDeleteBatchMutation();
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [form, setForm] = useState({
    course_id: "",
    subcourse_id: "",
    batch_name: "",
    description: "",
    room_name: "",
    schedule_notes: "",
    start_date: "",
    end_date: "",
    active: true
  });

  const openEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setForm({
      course_id: batch.course_id,
      subcourse_id: batch.subcourse_id,
      batch_name: batch.batch_name,
      description: batch.detail?.description ?? "",
      room_name: batch.detail?.room_name ?? "",
      schedule_notes: batch.detail?.schedule_notes ?? "",
      start_date: batch.detail?.start_date ?? "",
      end_date: batch.detail?.end_date ?? "",
      active: batch.active
    });
  };

  const courseOptions = useMemo(
    () => [{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))],
    [courses]
  );
  const subcourseOptions = useMemo(
    () => [
      { label: "Select subcourse", value: "" },
      ...subcourses
        .filter((item) => !form.course_id || item.course_id === form.course_id)
        .map((item) => ({ label: item.subcourse_name, value: item.subcourse_id }))
    ],
    [form.course_id, subcourses]
  );

  return (
    <>
      <DataTable
        rows={batches}
        rowKey={(row) => row.batch_id}
        columns={[
          { key: "batch_name", header: "Batch" },
          {
            key: "course_name",
            header: "Course",
            render: (row) => courses.find((course) => course.course_id === row.course_id)?.course_name ?? row.course_id,
            getFilterValue: (row) => courses.find((course) => course.course_id === row.course_id)?.course_name ?? row.course_id
          },
          {
            key: "subcourse_name",
            header: "SubCourse",
            render: (row) => subcourses.find((subcourse) => subcourse.subcourse_id === row.subcourse_id)?.subcourse_name ?? row.subcourse_id,
            getFilterValue: (row) => subcourses.find((subcourse) => subcourse.subcourse_id === row.subcourse_id)?.subcourse_name ?? row.subcourse_id
          },
          { key: "room_name", header: "Room / Branch", render: (row) => row.detail?.room_name ?? "-" },
          { key: "start_date", header: "Start", render: (row) => row.detail?.start_date ?? "-" },
          { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openEdit(row)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete batch "${row.batch_name}"?`)) {
                      deleteBatch.mutate(row.batch_id);
                    }
                  }}
                  disabled={deleteBatch.isPending}
                >
                  Delete
                </Button>
                <AppLink
                  href={`${detailBasePath}/${row.batch_id}${instituteId ? `?instituteId=${instituteId}` : ""}`}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  View Details
                </AppLink>
              </div>
            )
          }
        ]}
      />

      <Modal title="Update Batch" open={Boolean(selectedBatch)} onClose={() => setSelectedBatch(null)}>
        <div className="space-y-3">
          <Select
            label="Course"
            options={courseOptions}
            value={form.course_id}
            onChange={(e) => setForm((prev) => ({ ...prev, course_id: e.target.value, subcourse_id: "" }))}
            required
          />
          <Select
            label="SubCourse"
            options={subcourseOptions}
            value={form.subcourse_id}
            onChange={(e) => setForm((prev) => ({ ...prev, subcourse_id: e.target.value }))}
            required
          />
          <Input label="Batch Name" value={form.batch_name} onChange={(e) => setForm((prev) => ({ ...prev, batch_name: e.target.value }))} required />
          <Input label="Room / Branch" value={form.room_name} onChange={(e) => setForm((prev) => ({ ...prev, room_name: e.target.value }))} />
          <Input label="Start Date" value={form.start_date} onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))} />
          <Input label="End Date" value={form.end_date} onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))} />
          <Input label="Schedule Notes" value={form.schedule_notes} onChange={(e) => setForm((prev) => ({ ...prev, schedule_notes: e.target.value }))} />
          <Input label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedBatch) return;
                updateBatch.mutate(
                  {
                    batchId: selectedBatch.batch_id,
                    payload: {
                      ...form,
                      institute_id: instituteId
                    }
                  },
                  { onSuccess: () => setSelectedBatch(null) }
                );
              }}
              disabled={updateBatch.isPending}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedBatch(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
