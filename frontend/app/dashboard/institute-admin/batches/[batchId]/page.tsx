"use client";

import { useParams } from "next/navigation";

import { BatchDetailWorkspace } from "@/components/batches/BatchDetailWorkspace";

export default function InstituteAdminBatchDetailPage() {
  const params = useParams<{ batchId: string }>();
  return <BatchDetailWorkspace batchId={params.batchId} badge="Institute Batch Detail" />;
}

