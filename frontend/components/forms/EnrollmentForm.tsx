"use client";

import { FormEvent, useState } from "react";

import { useEnrollStudentMutation } from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function EnrollmentForm() {
  const enroll = useEnrollStudentMutation();
  const [payload, setPayload] = useState({
    user_id: "",
    course_id: "",
    subcourse_id: ""
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    enroll.mutate(payload);
  };

  return (
    <Card>
      <h3 className="mb-3 text-lg font-semibold">Enroll Student</h3>
      <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
        <Input
          label="User ID"
          value={payload.user_id}
          onChange={(e) => setPayload((prev) => ({ ...prev, user_id: e.target.value }))}
          required
        />
        <Input
          label="Course ID"
          value={payload.course_id}
          onChange={(e) => setPayload((prev) => ({ ...prev, course_id: e.target.value }))}
          required
        />
        <Input
          label="SubCourse ID"
          value={payload.subcourse_id}
          onChange={(e) => setPayload((prev) => ({ ...prev, subcourse_id: e.target.value }))}
          required
        />
        <div className="md:col-span-3">
          <Button type="submit" disabled={enroll.isPending}>
            Enroll
          </Button>
        </div>
      </form>
    </Card>
  );
}
