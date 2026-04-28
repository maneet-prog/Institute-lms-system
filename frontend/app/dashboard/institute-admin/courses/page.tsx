"use client";

import { CourseManagementWorkspace } from "@/components/courses/CourseManagementWorkspace";

export default function InstituteAdminCoursesPage() {
  return (
    <CourseManagementWorkspace
      badge="Institute Management"
      title="Courses and SubCourses"
      description="Build your institute course structure one layer at a time. Choose a course to see only its own subcourses, modules, and content actions."
    />
  );
}
