"use client";

import { useParams, useSearchParams } from "next/navigation";

import { TecaiExamFrame } from "@/components/content/TecaiExamFrame";
import { useTecaiExamQuery } from "@/hooks/useLmsQueries";

export default function TecaiSavedExamPage() {
  const params = useParams<{ contentId: string }>();
  const searchParams = useSearchParams();
  const { data, isLoading } = useTecaiExamQuery(params.contentId);
  const autoStart = searchParams.get("autostart") === "1";

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
        Exam data is not available.
      </div>
    );
  }

  return (
    <TecaiExamFrame
      content={data.content}
      renderer={data.renderer}
      submission={data.submission}
      autoStart={autoStart}
      allowSave={Object.prototype.hasOwnProperty.call(data, "submission")}
    />
  );
}
