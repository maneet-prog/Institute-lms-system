import { api } from "@/services/client";
import { Batch, BatchDetail, MessageResponse } from "@/types/lms";

export async function getBatches(instituteId?: string): Promise<Batch[]> {
  const { data } = await api.get<Batch[]>("/batches", {
    params: instituteId ? { institute_id: instituteId } : undefined
  });
  return data;
}

export async function getBatchDetail(batchId: string, instituteId?: string): Promise<BatchDetail> {
  const { data } = await api.get<BatchDetail>(`/batches/${batchId}/details`, {
    params: instituteId ? { institute_id: instituteId } : undefined
  });
  return data;
}

export async function createBatch(payload: {
  course_id: string;
  subcourse_id: string;
  batch_name: string;
  description?: string;
  room_name?: string;
  schedule_notes?: string;
  start_date?: string;
  end_date?: string;
  institute_id?: string;
}): Promise<Batch> {
  const { data } = await api.post<Batch>("/batches", payload);
  return data;
}

export async function updateBatch(
  batchId: string,
  payload: {
    course_id: string;
    subcourse_id: string;
    batch_name: string;
    description?: string;
    room_name?: string;
    schedule_notes?: string;
    start_date?: string;
    end_date?: string;
    institute_id?: string;
    active: boolean;
  }
): Promise<Batch> {
  const { data } = await api.put<Batch>(`/batches/${batchId}`, payload);
  return data;
}

export async function deleteBatch(batchId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/batches/${batchId}`);
  return data;
}

export async function assignTeacher(payload: {
  batch_id: string;
  user_id: string;
  institute_id?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>("/assign-teacher", payload);
  return data;
}

export async function removeTeacher(payload: {
  batch_id: string;
  user_id: string;
  institute_id?: string;
}): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>("/assign-teacher", { data: payload });
  return data;
}

export async function assignStudentToBatch(payload: {
  user_id: string;
  batch_id: string;
  institute_id?: string;
}): Promise<{ user_batch_id: string }> {
  const { data } = await api.post<{ user_batch_id: string }>("/assign-batch", payload);
  return data;
}

export async function removeStudentFromBatch(payload: {
  user_id: string;
  batch_id: string;
  institute_id?: string;
}): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>("/assign-batch", { data: payload });
  return data;
}

export async function enrollStudent(payload: {
  user_id: string;
  course_id: string;
  subcourse_id: string;
  institute_id?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post<{ id: string }>("/enroll", payload);
  return data;
}
