"use client";

import { useParams } from "next/navigation";

import {
  useBatchesQuery,
  useCoursesByInstituteQuery,
  useInstitutesQuery,
  useSubCoursesByInstituteQuery,
  useUsersByInstituteQuery
} from "@/hooks/useLmsQueries";
import { BatchCatalogTable } from "@/components/tables/BatchCatalogTable";
import { CourseCatalogTables } from "@/components/tables/CourseCatalogTables";
import { UsersTable } from "@/components/tables/UsersTable";
import { Card } from "@/components/ui/Card";

export default function InstituteDetailPage() {
  const params = useParams<{ id: string }>();
  const instituteId = params.id;
  const { data: institutes = [] } = useInstitutesQuery();
  const { data: users = [] } = useUsersByInstituteQuery(instituteId);
  const { data: courses = [] } = useCoursesByInstituteQuery(instituteId);
  const { data: subcourses = [] } = useSubCoursesByInstituteQuery({ institute_id: instituteId });
  const { data: batches = [] } = useBatchesQuery(instituteId);

  const institute = institutes.find((item) => item.institute_id === instituteId);
  const teachers = users.filter((user) => user.role_names.includes("teacher"));
  const students = users.filter((user) => user.role_names.includes("student"));

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Institute Detail</p>
        <h1 className="mt-2 text-2xl font-semibold">{institute?.name ?? "Institute"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review all institute-related data including courses, teachers, students, and batches.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Courses</h2>
          <CourseCatalogTables courses={courses} subcourses={subcourses} instituteId={instituteId} />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Batches</h2>
          <BatchCatalogTable
            batches={batches}
            courses={courses}
            subcourses={subcourses}
            instituteId={instituteId}
            detailBasePath="/dashboard/admin/batches"
          />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Teachers</h2>
          <UsersTable users={teachers} roleFilter="teacher" title="Edit Teacher" />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Students</h2>
          <UsersTable users={students} roleFilter="student" title="Edit Student" />
        </Card>
      </div>
    </div>
  );
}
