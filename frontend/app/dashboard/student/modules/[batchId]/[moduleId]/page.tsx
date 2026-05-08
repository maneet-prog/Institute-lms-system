"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { AppLink } from "@/components/navigation/AppLink";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Card } from "@/components/ui/Card";
import { useStudentBatchWorkspaceQuery } from "@/hooks/useLmsQueries";

function formatScore(value: number | null | undefined, maxScore: number) {
  return maxScore > 0 ? `${value ?? 0}/${maxScore}` : String(value ?? 0);
}

export default function StudentModuleDetailPage() {
  const params = useParams<{ batchId: string; moduleId: string }>();
  const { data, isLoading } = useStudentBatchWorkspaceQuery(params.batchId);

  const moduleDetail = useMemo(
    () => data?.modules.find((entry) => entry.module_id === params.moduleId) ?? null,
    [data, params.moduleId]
  );
  const buildCourseExamHref = (contentId: string) =>
    `/course/${data?.course_id}/${data?.subcourse_id}/${params.moduleId}?batch_id=${params.batchId}&content_id=${contentId}&autostart=1`;

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading module details...</p>;
  }

  if (!data || !moduleDetail) {
    return <p className="text-sm text-slate-600">Module details are not available.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Module Detail</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{moduleDetail.module_name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {data.batch_name} | {data.course_name} | {data.subcourse_name}
        </p>
      </Card>

      <div className="space-y-4">
        {moduleDetail.content.map((item, index) => (
          <details key={item.content_id} open={index === 0} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none">
              {(() => {
                const isDynamicExam =
                  item.type === "quiz" &&
                  (item.quiz?.renderer?.kind === "tecai_reading" || item.quiz?.renderer?.kind === "tecai_writing");

                return (
                  <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.type} | {item.category} | {item.duration} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* {isDynamicExam ? (
                    <AppLink
                      href={buildCourseExamHref(item.content_id)}
                      className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open Exam
                    </AppLink>
                  ) : null} */}
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {item.submission ? "Submitted" : "Open Content"}
                  </span>
                </div>
              </div>
                  </>
                );
              })()}
            </summary>

            <div className="mt-4 space-y-4">
              {item.instructions ? <p className="text-sm text-slate-600">{item.instructions}</p> : null}
              <ContentRenderer content={item} />
              {item.submission ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Latest submission status: {item.submission.review_status}</p>
                  <p className="mt-1">
                    Attempt {item.submission.latest_attempt_number} | Marks{" "}
                    {formatScore(item.submission.latest_awarded_marks ?? item.submission.latest_auto_score, item.submission.max_score)}
                  </p>
                  {item.submission.feedback ? <p className="mt-1">Feedback: {item.submission.feedback}</p> : null}
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
