import { api } from "@/services/client";
import {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegistrationStartResponse,
  RegistrationVerifyPayload,
  RegistrationVerifyResponse
} from "@/types/auth";
export async function registerUser(payload: RegisterPayload): Promise<RegistrationStartResponse> {
  const { data } = await api.post<RegistrationStartResponse>("/auth/register", payload);
  return data;
}

export async function verifyRegistration(payload: RegistrationVerifyPayload): Promise<RegistrationVerifyResponse> {
  const { data } = await api.post<RegistrationVerifyResponse>("/auth/register/verify", payload);
  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password", payload);
  return data;
}
