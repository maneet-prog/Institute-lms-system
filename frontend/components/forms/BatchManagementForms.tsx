"use client";

import { FormEvent, useMemo, useState } from "react";

import { useAuthStore } from "@/store/auth";
import {
  useAssignStudentBatchMutation,
  useAssignTeacherMutation,
  useBatchDetailQuery,
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useCreateBatchMutation,
  useInstitutesQuery,
  useSubCoursesByInstituteQuery,
  useUsersByInstituteQuery,
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { Select } from "@/components/ui/Select";

interface Props {
  allowInstituteSelect?: boolean;
}

export function BatchManagementForms({ allowInstituteSelect = false }: Props) {
  const role = useAuthStore((state) => state.role);
  const userInstituteId = useAuthStore((state) => state.instituteId);
  const createBatch = useCreateBatchMutation();
  const assignTeacher = useAssignTeacherMutation();
  const assignStudentToBatch = useAssignStudentBatchMutation();
  const [selectedInstituteId, setSelectedInstituteId] = useState(userInstituteId ?? "");
  const targetInstituteId =
    allowInstituteSelect && role === "super_admin" ? selectedInstituteId : userInstituteId ?? "";
  const { data: institutes = [] } = useInstitutesQuery();
  const { data: users = [] } = useUsersByInstituteQuery(targetInstituteId || undefined);
  const { data: courses = [] } = useCoursesByInstituteQuery(targetInstituteId || undefined);
  const { data: batches = [] } = useBatchesQuery(targetInstituteId || undefined);

  const [batch, setBatch] = useState({
    course_id: "",
    subcourse_id: "",
    batch_name: "",
    description: "",
    room_name: "",
    schedule_notes: "",
    start_date: "",
    end_date: ""
  });
  const [teacherAssign, setTeacherAssign] = useState({ batch_id: "", user_id: "" });
  const [studentBatchId, setStudentBatchId] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const { data: selectedBatchDetail } = useBatchDetailQuery(
    studentBatchId || undefined,
    allowInstituteSelect && role === "super_admin" ? targetInstituteId || undefined : undefined
  );
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery(
    targetInstituteId
      ? { institute_id: targetInstituteId, course_id: batch.course_id || undefined }
      : undefined
  );

  const availableUsers = users;

  const teacherOptions = useMemo(
    () =>
      users
        .filter((user) => !allowInstituteSelect || !targetInstituteId || user.institute_id === targetInstituteId)
        .filter((user) => user.active && user.role_names.includes("teacher"))
        .map((user) => ({ label: `${user.first_name} ${user.last_name}`, value: user.user_id })),
    [allowInstituteSelect, targetInstituteId, users]
  );

  const filteredStudentOptions = useMemo(
    () => {
      const assignedStudentIds = new Set(selectedBatchDetail?.students.map((student) => student.user_id) ?? []);
      return availableUsers
        .filter((user) => user.active && user.role_names.includes("student"))
        .filter((user) => !assignedStudentIds.has(user.user_id))
        .map((user) => ({ label: `${user.first_name} ${user.last_name}`, value: user.user_id }));
    },
    [availableUsers, selectedBatchDetail]
  );

  const instituteOptions = useMemo(
    () => [
      { label: "Select institute", value: "" },
      ...institutes.map((institute) => ({ label: institute.name, value: institute.institute_id }))
    ],
    [institutes]
  );

  const courseOptions = useMemo(
    () => [
      { label: "Select course", value: "" },
      ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))
    ],
    [courses]
  );

  const subcourseOptions = useMemo(
    () => [
      { label: "Select subcourse", value: "" },
      ...subcourses.map((subcourse) => ({ label: subcourse.subcourse_name, value: subcourse.subcourse_id }))
    ],
    [subcourses]
  );

  const batchOptions = useMemo(
    () => [
      { label: "Select batch", value: "" },
      ...batches.map((entry) => ({ label: entry.batch_name, value: entry.batch_id }))
    ],
    [batches]
  );

  const submitBatch = (event: FormEvent) => {
    event.preventDefault();
    createBatch.mutate({ ...batch, institute_id: targetInstituteId || undefined }, {
      onSuccess: () =>
        setBatch({
          course_id: "",
          subcourse_id: "",
          batch_name: "",
          description: "",
          room_name: "",
          schedule_notes: "",
          start_date: "",
          end_date: ""
        })
    });
  };

  const submitTeacher = (event: FormEvent) => {
    event.preventDefault();
    assignTeacher.mutate({ ...teacherAssign, institute_id: targetInstituteId || undefined }, {
      onSuccess: () => setTeacherAssign({ batch_id: "", user_id: "" })
    });
  };

  const submitStudentAssignments = (event: FormEvent) => {
    event.preventDefault();
    studentIds.forEach((userId) => {
      assignStudentToBatch.mutate({
        user_id: userId,
        batch_id: studentBatchId,
        institute_id: targetInstituteId || undefined
      });
    });
    setStudentIds([]);
    setStudentBatchId("");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card>
        <h3 className="mb-3 text-lg font-semibold">Create Batch</h3>
        <form className="space-y-3" onSubmit={submitBatch}>
          {allowInstituteSelect && role === "super_admin" ? (
            <Select
              label="Institute"
              options={instituteOptions}
              value={selectedInstituteId}
              onChange={(e) => {
                setSelectedInstituteId(e.target.value);
                setBatch({
                  course_id: "",
                  subcourse_id: "",
                  batch_name: "",
                  description: "",
                  room_name: "",
                  schedule_notes: "",
                  start_date: "",
                  end_date: ""
                });
                setTeacherAssign({ batch_id: "", user_id: "" });
                setStudentBatchId("");
                setStudentIds([]);
              }}
              required
            />
          ) : null}
          <Select
            label="Course"
            options={courseOptions}
            value={batch.course_id}
            onChange={(e) =>
              setBatch((prev) => ({
                ...prev,
                course_id: e.target.value,
                subcourse_id: ""
              }))
            }
            required
          />
          <Select
            label="SubCourse"
            options={subcourseOptions}
            value={batch.subcourse_id}
            onChange={(e) => setBatch((prev) => ({ ...prev, subcourse_id: e.target.value }))}
            required
          />
          <Input
            label="Batch Name"
            value={batch.batch_name}
            onChange={(e) => setBatch((prev) => ({ ...prev, batch_name: e.target.value }))}
            required
          />
          <Input
            label="Room / Branch"
            value={batch.room_name}
            onChange={(e) => setBatch((prev) => ({ ...prev, room_name: e.target.value }))}
          />
          <Input
            label="Start Date"
            placeholder="YYYY-MM-DD"
            value={batch.start_date}
            onChange={(e) => setBatch((prev) => ({ ...prev, start_date: e.target.value }))}
          />
          <Input
            label="End Date"
            placeholder="YYYY-MM-DD"
            value={batch.end_date}
            onChange={(e) => setBatch((prev) => ({ ...prev, end_date: e.target.value }))}
          />
          <Input
            label="Schedule Notes"
            value={batch.schedule_notes}
            onChange={(e) => setBatch((prev) => ({ ...prev, schedule_notes: e.target.value }))}
            placeholder="Mon/Wed/Fri - 10 AM"
          />
          <Input
            label="Description"
            value={batch.description}
            onChange={(e) => setBatch((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Batch focus, level, or delivery notes"
          />
          <Button type="submit" disabled={createBatch.isPending}>
            Save Batch
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Assign Teacher</h3>
        <form className="space-y-3" onSubmit={submitTeacher}>
          {allowInstituteSelect && role === "super_admin" ? (
            <Input label="Institute" value={institutes.find((item) => item.institute_id === targetInstituteId)?.name ?? ""} disabled />
          ) : null}
          <Select
            label="Batch Name"
            options={batchOptions}
            value={teacherAssign.batch_id}
            onChange={(e) => setTeacherAssign((prev) => ({ ...prev, batch_id: e.target.value }))}
            required
          />
          <Select
            label="Teacher"
            options={[{ label: "Select teacher", value: "" }, ...teacherOptions]}
            value={teacherAssign.user_id}
            onChange={(e) => setTeacherAssign((prev) => ({ ...prev, user_id: e.target.value }))}
            required
          />
          <Button type="submit" disabled={assignTeacher.isPending}>
            Assign Teacher
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Assign Students</h3>
        <form className="space-y-3" onSubmit={submitStudentAssignments}>
          {allowInstituteSelect && role === "super_admin" ? (
            <Input label="Institute" value={institutes.find((item) => item.institute_id === targetInstituteId)?.name ?? ""} disabled />
          ) : null}
          <Select
            label="Batch Name"
            options={batchOptions}
            value={studentBatchId}
            onChange={(e) => setStudentBatchId(e.target.value)}
            required
          />
          <MultiSelect label="Students" options={filteredStudentOptions} value={studentIds} onChange={setStudentIds} required />
          <Button type="submit" disabled={assignStudentToBatch.isPending}>
            Assign Students
          </Button>
        </form>
      </Card>
    </div>
  );
}
