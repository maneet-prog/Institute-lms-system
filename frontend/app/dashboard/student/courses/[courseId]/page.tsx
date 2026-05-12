"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppLink } from "@/components/navigation/AppLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { StudentContentSubmissionPanel } from "@/components/content/StudentContentSubmissionPanel";
import { useStudentBatchWorkspaceQuery } from "@/hooks/useLmsQueries";

function formatScore(value: number | null | undefined, maxScore: number) {
  return maxScore > 0 ? `${value ?? 0}/${maxScore}` : String(value ?? 0);
}

export default function StudentCourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { data, isLoading } = useStudentBatchWorkspaceQuery(params.courseId, selectedCategory);

  const categories = useMemo(() => data?.content_categories ?? [], [data]);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading course workspace...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-600">Course workspace not available.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Student Batch Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold">{data.batch_name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          View only the learning content assigned through your batch and switch categories as needed.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Course Path</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{data.course_name}</p>
            <p className="mt-1 text-sm text-slate-600">{data.subcourse_name}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Learning Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={selectedCategory ? "secondary" : "primary"} onClick={() => setSelectedCategory(undefined)}>
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "secondary"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </Card>

      {data.modules.map((module) => (
        <Card key={module.module_id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{module.module_name}</h2>
              <p className="mt-1 text-sm text-slate-600">{module.subcourse_name}</p>
            </div>
            <AppLink
              href={`/dashboard/student/modules/${data.batch_id}/${module.module_id}`}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Module Page
            </AppLink>
          </div>
          <div className="mt-4 space-y-4">
            {module.content.map((item) => (
              <div key={item.content_id} className="rounded-xl border p-4">
                {(() => {
                  const isDynamicExam =
                    item.type === "quiz" &&
                    (item.quiz?.renderer?.kind === "tecai_reading" || item.quiz?.renderer?.kind === "tecai_writing");

                  return (
                    <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-600">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">{item.duration} min</div>
                    {/* {isDynamicExam ? (
                      <AppLink
                        href={buildCourseExamHref(module.module_id, item.content_id)} target="_blank"
                        className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Exam
                      </AppLink>
                    ) : null} */}
                  </div>
                </div>

                {item.instructions ? <p className="mt-3 text-sm text-slate-600">{item.instructions}</p> : null}

                <div className="mt-4">
                  <ContentRenderer content={item} />
                </div>
                <div className="mt-4">
                  <StudentContentSubmissionPanel content={item} />
                </div>

                {item.submission ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <p>Submitted on {new Date(item.submission.submitted_at).toLocaleString("en-IN")}</p>
                    <p>
                      Status: {item.submission.review_status} | Latest marks:{" "}
                      {formatScore(item.submission.latest_awarded_marks ?? item.submission.latest_auto_score, item.submission.max_score)}
                    </p>
                    {item.submission.feedback ? <p>Feedback: {item.submission.feedback}</p> : null}
                  </div>
                ) : null}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
