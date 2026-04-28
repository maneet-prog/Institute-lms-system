import { api } from "@/services/client";
import { MessageResponse, User } from "@/types/lms";

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
