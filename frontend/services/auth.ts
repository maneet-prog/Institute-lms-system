import { api } from "@/services/client";
import { LoginPayload, LoginResponse, RegisterPayload } from "@/types/auth";
import { User } from "@/types/lms";

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}
