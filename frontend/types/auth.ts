import type { User } from "@/types/lms";

export type Role = "super_admin" | "institute_admin" | "teacher" | "student";

export interface AuthUser {
  user_id: string;
  institute_id: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: Role[];
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
}

export interface RegistrationStartResponse {
  verification_id: string;
  expires_at: string;
  message: string;
  delivery?: {
    email_preview?: {
      to: string;
      subject: string;
      text: string;
      html: string;
    } | null;
    sms_preview?: {
      to: string;
      message: string;
    } | null;
    email_otp?: string;
    mobile_otp?: string;
  };
}

export interface RegistrationVerifyPayload {
  verification_id: string;
  email_otp: string;
  mobile_otp: string;
}

export interface RegistrationVerifyResponse {
  message: string;
  user: User;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  mob_no: string;
  password: string;
  course_id?: string;
  subcourse_id?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
  mob_no: string;
}

export interface ForgotPasswordResponse {
  message: string;
  delivery?: {
    email_preview?: {
      to: string;
      subject: string;
      text: string;
      html: string;
    } | null;
    temporary_password?: string;
  };
}
