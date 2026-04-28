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
