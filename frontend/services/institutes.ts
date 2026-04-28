import { api } from "@/services/client";
import { Institute, MessageResponse } from "@/types/lms";

export interface CreateInstitutePayload {
  name: string;
  email: string;
  mob_no: string;
  country: string;
  state: string;
  place: string;
  pincode: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_password: string;
}

export async function getInstitutes(): Promise<Institute[]> {
  const { data } = await api.get<Institute[]>("/institutes");
  return data;
}

export async function createInstitute(payload: CreateInstitutePayload): Promise<Institute> {
  const { data } = await api.post<Institute>("/institutes", payload);
  return data;
}

export async function updateInstitute(
  instituteId: string,
  payload: Omit<CreateInstitutePayload, "admin_first_name" | "admin_last_name" | "admin_password"> & {
    active: boolean;
    admin_first_name?: string;
    admin_last_name?: string;
    admin_password?: string;
  }
): Promise<Institute> {
  const { data } = await api.put<Institute>(`/institutes/${instituteId}`, payload);
  return data;
}

export async function deleteInstitute(instituteId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/institutes/${instituteId}`);
  return data;
}
