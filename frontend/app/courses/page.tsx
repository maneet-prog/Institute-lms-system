"use client";

import { useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { usePublicCoursesQuery, usePublicSubCoursesQuery } from "@/hooks/useLmsQueries";

export default function CoursesPage() {
  const { data: courses = [], isLoading } = usePublicCoursesQuery();
  const [activeCourseId, setActiveCourseId] = useState("");
  const { data: subcourses = [] } = usePublicSubCoursesQuery(activeCourseId || undefined);

  return (
    <section className="page-shell space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Course Explorer</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Explore courses, subcourses, and register faster</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Open any course to see its available subcourses. When you choose one, the registration form opens with that course path already selected.
        </p>
      </Card>

      {isLoading ? <p className="text-sm text-slate-600">Loading courses...</p> : null}

      <div className="space-y-4">
        {courses.map((course) => {
          const isActive = activeCourseId === course.course_id;
          const visibleSubcourses = isActive ? subcourses : [];

          return (
            <details
              key={course.course_id}
              open={isActive}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              onToggle={(event) => {
                const nextOpen = (event.currentTarget as HTMLDetailsElement).open;
                setActiveCourseId(nextOpen ? course.course_id : "");
              }}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{course.course_name}</h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">{course.description || "Course overview will appear here."}</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    {isActive ? "Hide Subcourses" : "View Subcourses"}
                  </span>
                </div>
              </summary>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {isActive && visibleSubcourses.length ? (
                  visibleSubcourses.map((subcourse) => (
                    <Link
                      key={subcourse.subcourse_id}
                      href={`/register?courseId=${course.course_id}&subcourseId=${subcourse.subcourse_id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
                    >
                      <p className="text-base font-semibold text-slate-900">{subcourse.subcourse_name}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {subcourse.description || "Open registration with this selected subcourse."}
                      </p>
                      <p className="mt-4 text-sm font-semibold text-brand-700">Register for this subcourse</p>
                    </Link>
                  ))
                ) : isActive ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                    No subcourses are available for this course yet.
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
