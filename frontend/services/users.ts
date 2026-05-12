import { api } from "@/services/client";
import { MessageResponse, User, UserDetailsResponse } from "@/types/lms";

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function getUsersByInstitute(instituteId?: string): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", {
    params: instituteId ? { institute_id: instituteId } : undefined
  });
  return data;
}

export async function createUser(payload: {
  first_name: string;
  last_name: string;
  email: string;
  mob_no: string;
  password: string;
  course_id?: string;
  subcourse_id?: string;
  batch_id?: string;
  is_approved?: boolean;
  active?: boolean;
  institute_id?: string;
  role_names: string[];
}): Promise<User> {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function approveUser(
  userId: string,
  payload: {
    approve?: boolean;
    course_id?: string;
    subcourse_id?: string;
    batch_id?: string;
  } = {}
): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/approve`, {
    approve: payload.approve ?? true,
    course_id: payload.course_id,
    subcourse_id: payload.subcourse_id,
    batch_id: payload.batch_id
  });
  return data;
}

export async function assignInstitute(userId: string, instituteId: string): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/assign-institute`, {
    institute_id: instituteId
  });
  return data;
}

export async function assignRoles(userId: string, roleNames: string[]): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/users/${userId}/roles`, {
    role_names: roleNames
  });
  return data;
}

export async function updateUser(
  userId: string,
  payload: {
    first_name: string;
    last_name: string;
    email: string;
    mob_no: string;
    course_id?: string;
    subcourse_id?: string;
    batch_id?: string;
    is_approved: boolean;
    active: boolean;
    institute_id?: string;
    role_names?: string[];
  }
): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: string): Promise<MessageResponse> {
  const { data } = await api.delete<MessageResponse>(`/users/${userId}`);
  return data;
}

export async function updateProfile(payload: {
  email: string;
  current_password: string;
  new_password?: string;
}): Promise<User> {
  const { data } = await api.put<User>("/users/me/profile", payload);
  return data;
}

export async function getUserDetails(userId: string): Promise<UserDetailsResponse> {
  const { data } = await api.get<UserDetailsResponse>(`/users/${userId}/details`);
  return data;
}

export async function enrollUser(userId: string, payload: {
  course_id: string;
  subcourse_id?: string;
  batch_id?: string;
}): Promise<any> {
  const { data } = await api.post(`/users/${userId}/enroll`, payload);
  return data;
}

export async function removeUserEnrollment(enrollmentId: string): Promise<MessageResponse> {
  const { data } = await api.delete(`/users/${enrollmentId}/enroll/${enrollmentId}`);
  return data;
}

export async function assignUserToBatch(userId: string, payload: {
  batch_id: string;
  role: "student" | "teacher";
}): Promise<any> {
  const { data } = await api.post(`/users/${userId}/batches`, payload);
  return data;
}

export async function removeUserFromBatch(userId: string, batchAssignmentId: string): Promise<MessageResponse> {
  const { data } = await api.delete(`/users/${userId}/batches/${batchAssignmentId}`);
  return data;
}

export async function createUserContent(userId: string, payload: {
  title: string;
  description?: string;
  content_type: string;
  content_data: any;
  module_id: string;
  batch_id: string;
  due_date?: string;
  max_marks?: number;
}): Promise<any> {
  const { data } = await api.post(`/users/${userId}/content`, payload);
  return data;
}

export async function updateUserContent(userId: string, contentId: string, payload: {
  title?: string;
  description?: string;
  content_data?: any;
  due_date?: string;
  max_marks?: number;
}): Promise<any> {
  const { data } = await api.put(`/users/${userId}/content/${contentId}`, payload);
  return data;
}

export async function deleteUserContent(userId: string, contentId: string): Promise<MessageResponse> {
  const { data } = await api.delete(`/users/${userId}/content/${contentId}`);
  return data;
}

export async function reviewUserSubmission(userId: string, submissionId: string, payload: {
  marks?: number;
  feedback?: string;
  status: "reviewed" | "pending";
}): Promise<any> {
  const { data } = await api.put(`/users/${userId}/submissions/${submissionId}/review`, payload);
  return data;
}
