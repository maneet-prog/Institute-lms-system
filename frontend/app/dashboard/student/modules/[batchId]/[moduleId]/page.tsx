"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import { ContentRenderer } from "@/components/content/ContentRenderer";
import { Card } from "@/components/ui/Card";
import { useStudentBatchWorkspaceQuery } from "@/hooks/useLmsQueries";

export default function StudentModuleDetailPage() {
  const params = useParams<{ batchId: string; moduleId: string }>();
  const { data, isLoading } = useStudentBatchWorkspaceQuery(params.batchId);

  const moduleDetail = useMemo(
    () => data?.modules.find((entry) => entry.module_id === params.moduleId) ?? null,
    [data, params.moduleId]
  );

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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.type} | {item.category} | {item.duration} min
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {item.submission ? "Submitted" : "Open Content"}
                </span>
              </div>
            </summary>

            <div className="mt-4 space-y-4">
              {item.instructions ? <p className="text-sm text-slate-600">{item.instructions}</p> : null}
              <ContentRenderer content={item} />
              {item.submission ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Latest submission status: {item.submission.review_status}</p>
                  <p className="mt-1">
                    Attempt {item.submission.latest_attempt_number} | Marks {item.submission.latest_awarded_marks ?? item.submission.latest_auto_score}
                    /{item.submission.max_score}
                  </p>
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
