"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TecaiExamFrame } from "@/components/content/TecaiExamFrame";
import { Content } from "@/types/lms";
import { loadTecaiPreviewContent } from "@/utils/tecaiPreview";

export default function TecaiPreviewExamPage() {
  const searchParams = useSearchParams();
  const previewKey = searchParams.get("preview_key") || "";
  const [previewContent, setPreviewContent] = useState<Content | null>(null);

  useEffect(() => {
    setPreviewContent(loadTecaiPreviewContent(previewKey));
  }, [previewKey]);

  if (!previewContent && previewKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Loading preview...
      </div>
    );
  }

  if (!previewContent?.quiz?.renderer || previewContent.quiz.renderer.kind !== "tecai_reading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Preview data is not available.
      </div>
    );
  }

  return (
    <TecaiExamFrame
      content={previewContent}
      renderer={previewContent.quiz.renderer}
      autoStart
      allowSave={false}
    />
  );
}
