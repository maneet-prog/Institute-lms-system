import { api } from "@/services/client";
import { ReviewableSubmission } from "@/types/lms";

export async function getReviewableSubmissions(filters?: {
  batchId?: string;
  courseId?: string;
  userId?: string;
}): Promise<ReviewableSubmission[]> {
  const params: Record<string, string> = {};
  if (filters?.batchId) params.batch_id = filters.batchId;
  if (filters?.courseId) params.course_id = filters.courseId;
  if (filters?.userId) params.user_id = filters.userId;

  const { data } = await api.get<ReviewableSubmission[]>("/submissions", { params });
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
