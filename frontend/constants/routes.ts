import { Role } from "@/types/auth";

export const ROLE_HOME: Record<Role, string> = {
  super_admin: "/dashboard/admin",
  institute_admin: "/dashboard/institute-admin",
  teacher: "/dashboard/teacher",
  student: "/dashboard/student"
};

export const PROTECTED_PREFIX = "/dashboard";

export function getRoleHome(role: Role | null | undefined) {
  if (!role) {
    return "/login";
  }
  return ROLE_HOME[role] ?? "/login";
}
