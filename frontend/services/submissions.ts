import { api } from "@/services/client";
import { ReviewableSubmission } from "@/types/lms";

export async function getReviewableSubmissions(batchId?: string): Promise<ReviewableSubmission[]> {
  const { data } = await api.get<ReviewableSubmission[]>("/submissions", {
    params: batchId ? { batch_id: batchId } : undefined
  });
  return data;
}

export async function reviewSubmission(
  submissionId: string,
  payload: {
    awarded_marks: number;
    feedback?: string;
    attempt_number?: number;
  }
): Promise<ReviewableSubmission> {
  const { data } = await api.put<ReviewableSubmission>(`/submissions/${submissionId}/review`, payload);
  return data;
}
