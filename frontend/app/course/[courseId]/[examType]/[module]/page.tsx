"use client";

import { useParams, useSearchParams } from "next/navigation";

import { TecaiExamFrame } from "@/components/content/TecaiExamFrame";
import { useCourseModuleExamQuery } from "@/hooks/useLmsQueries";

export default function CourseWiseExamPage() {
  const params = useParams<{ courseId: string; examType: string; module: string }>();
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("autostart") === "1";
  const batchId = searchParams.get("batch_id") || undefined;
  const contentId = searchParams.get("content_id") || undefined;
  const { data, isLoading } = useCourseModuleExamQuery(params.courseId, params.examType, params.module, {
    batch_id: batchId,
    content_id: contentId
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Loading exam...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Exam route is not available.
      </div>
    );
  }

  return (
    <TecaiExamFrame
      content={data.content}
      renderer={data.renderer}
      submission={data.submission}
      studentName={data.student_name}
      autoStart={autoStart}
      allowSave={Object.prototype.hasOwnProperty.call(data, "submission")}
      examContext={{
        course: data.course,
        exam_type: data.exam_type,
        module: data.module
      }}
    />
  );
}
