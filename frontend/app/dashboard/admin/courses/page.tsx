"use client";

import { CourseManagementWorkspace } from "@/components/courses/CourseManagementWorkspace";

export default function AdminCoursesPage() {
  return (
    <CourseManagementWorkspace
      badge="Admin Management"
      title="Courses and SubCourses"
      description="Manage the academic catalog across institutes without opening every form at once. Select a course to work on just that course."
    />
  );
}
