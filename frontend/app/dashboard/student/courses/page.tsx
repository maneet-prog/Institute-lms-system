"use client";

import { AppLink } from "@/components/navigation/AppLink";
import { Card } from "@/components/ui/Card";
import { useStudentBatchesQuery } from "@/hooks/useLmsQueries";

export default function StudentCoursesPage() {
  const { data = [], isLoading } = useStudentBatchesQuery();

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Student: My Batch Courses</h1>
        <p className="mt-2 text-sm text-slate-600">Open a batch workspace to view only the modules and materials assigned to that batch.</p>
      </Card>
      {isLoading ? <p>Loading courses...</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.map((batch) => (
          <Card key={batch.batch_id}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">{batch.batch_name}</p>
            <h2 className="mt-2 text-xl font-semibold">{batch.course_name}</h2>
            <p className="mt-1 text-sm text-slate-600">{batch.subcourse_name}</p>
            <div className="mt-4 space-y-1 text-sm text-slate-700">
              <p>Room / Branch: {batch.room_name || "-"}</p>
              <p>Schedule: {batch.schedule_notes || "-"}</p>
              <p>Duration: {batch.start_date || "-"} to {batch.end_date || "-"}</p>
            </div>
            <AppLink href={`/dashboard/student/courses/${batch.batch_id}`} className="mt-4 inline-block font-medium text-brand-700 hover:underline">
              Open Batch Workspace
            </AppLink>
          </Card>
        ))}
      </div>
    </div>
  );
}
