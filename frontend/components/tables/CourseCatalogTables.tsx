"use client";

import { useMemo, useState } from "react";

import { Course, SubCourse } from "@/types/lms";
import {
  useDeleteCourseMutation,
  useDeleteSubCourseMutation,
  useUpdateCourseMutation,
  useUpdateSubCourseMutation
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/tables/DataTable";

interface Props {
  courses: Course[];
  subcourses: SubCourse[];
  selectedCourseId?: string | null;
  onSelectCourse?: (courseId: string) => void;
  instituteId?: string;
}

export function CourseCatalogTables({
  courses,
  subcourses,
  selectedCourseId,
  onSelectCourse,
  instituteId
}: Props) {
  const updateCourse = useUpdateCourseMutation();
  const deleteCourse = useDeleteCourseMutation();
  const updateSubcourse = useUpdateSubCourseMutation();
  const deleteSubcourse = useDeleteSubCourseMutation();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    course_name: "",
    description: "",
    image_url: "",
    image: null as File | null,
    active: true
  });
  const [selectedSubcourse, setSelectedSubcourse] = useState<SubCourse | null>(null);
  const [subcourseForm, setSubcourseForm] = useState({
    course_id: "",
    subcourse_name: "",
    description: "",
    image_url: "",
    image: null as File | null,
    active: true
  });

  const courseOptions = useMemo(
    () => [{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))],
    [courses]
  );
  const visibleSubcourses = useMemo(
    () => subcourses.filter((subcourse) => !selectedCourseId || subcourse.course_id === selectedCourseId),
    [selectedCourseId, subcourses]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <DataTable
        rows={courses}
        rowKey={(row) => row.course_id}
        columns={[
          { key: "course_name", header: "Course Name" },
          { key: "course_id", header: "Course ID" },
          { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onSelectCourse?.(row.course_id)}>
                  {selectedCourseId === row.course_id ? "Selected" : "Open"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedCourse(row);
                    setCourseForm({
                      course_name: row.course_name,
                      description: row.description ?? "",
                      image_url: row.image_url ?? "",
                      image: null,
                      active: row.active
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete course "${row.course_name}"?`)) {
                      deleteCourse.mutate(row.course_id);
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

      <DataTable
        rows={visibleSubcourses}
        rowKey={(row) => row.subcourse_id}
        columns={[
          { key: "subcourse_name", header: "SubCourse Name" },
          { key: "course_id", header: "Course ID" },
          { key: "subcourse_id", header: "SubCourse ID" },
          { key: "active", header: "Active", render: (row) => (row.active ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedSubcourse(row);
                    setSubcourseForm({
                      course_id: row.course_id,
                      subcourse_name: row.subcourse_name,
                      description: row.description ?? "",
                      image_url: row.image_url ?? "",
                      image: null,
                      active: row.active
                    });
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete subcourse "${row.subcourse_name}"?`)) {
                      deleteSubcourse.mutate(row.subcourse_id);
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

      <Modal title="Edit Course" open={Boolean(selectedCourse)} onClose={() => setSelectedCourse(null)}>
        <div className="space-y-3">
          <Input
            label="Course Name"
            value={courseForm.course_name}
            onChange={(e) => setCourseForm((prev) => ({ ...prev, course_name: e.target.value }))}
          />
          <Input
            label="Description"
            value={courseForm.description}
            onChange={(e) => setCourseForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Image URL"
            value={courseForm.image_url}
            onChange={(e) => setCourseForm((prev) => ({ ...prev, image_url: e.target.value }))}
          />
          <input
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setCourseForm((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={courseForm.active}
              onChange={(e) => setCourseForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedCourse) return;
                updateCourse.mutate(
                  { courseId: selectedCourse.course_id, payload: { ...courseForm, institute_id: instituteId } },
                  { onSuccess: () => setSelectedCourse(null) }
                );
              }}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedCourse(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal title="Edit SubCourse" open={Boolean(selectedSubcourse)} onClose={() => setSelectedSubcourse(null)}>
        <div className="space-y-3">
          <Select
            label="Course"
            options={courseOptions}
            value={subcourseForm.course_id}
            onChange={(e) => setSubcourseForm((prev) => ({ ...prev, course_id: e.target.value }))}
          />
          <Input
            label="SubCourse Name"
            value={subcourseForm.subcourse_name}
            onChange={(e) => setSubcourseForm((prev) => ({ ...prev, subcourse_name: e.target.value }))}
          />
          <Input
            label="Description"
            value={subcourseForm.description}
            onChange={(e) => setSubcourseForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Image URL"
            value={subcourseForm.image_url}
            onChange={(e) => setSubcourseForm((prev) => ({ ...prev, image_url: e.target.value }))}
          />
          <input
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setSubcourseForm((prev) => ({ ...prev, image: e.target.files?.[0] ?? null }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={subcourseForm.active}
              onChange={(e) => setSubcourseForm((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedSubcourse) return;
                updateSubcourse.mutate(
                  {
                    subcourseId: selectedSubcourse.subcourse_id,
                    payload: { ...subcourseForm, institute_id: instituteId }
                  },
                  { onSuccess: () => setSelectedSubcourse(null) }
                );
              }}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedSubcourse(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
