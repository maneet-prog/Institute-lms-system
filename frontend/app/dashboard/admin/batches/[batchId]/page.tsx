"use client";

import { useParams, useSearchParams } from "next/navigation";

import { BatchDetailWorkspace } from "@/components/batches/BatchDetailWorkspace";

export default function AdminBatchDetailPage() {
  const params = useParams<{ batchId: string }>();
  const searchParams = useSearchParams();
  return (
    <BatchDetailWorkspace
      batchId={params.batchId}
      instituteId={searchParams.get("instituteId") ?? undefined}
      badge="Admin Batch Detail"
    />
  );
}

