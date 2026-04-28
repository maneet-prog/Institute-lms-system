import { api } from "@/services/client";
import { UserProgress } from "@/types/lms";

export async function markProgress(payload: {
  module_id: string;
  completed: boolean;
  progress_percent: number;
}): Promise<UserProgress> {
  const { data } = await api.post<UserProgress>("/progress/mark-complete", payload);
  return data;
}

export async function getMyProgress(): Promise<UserProgress[]> {
  const { data } = await api.get<UserProgress[]>("/progress/me");
  return data;
}
