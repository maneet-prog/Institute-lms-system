import { Role } from "@/types/auth";

export type AssignableRole = Exclude<Role, "super_admin">;

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  institute_admin: "Institute",
  teacher: "Teacher",
  student: "Student"
};

export function getAssignableRoles(role: Role | null): AssignableRole[] {
  if (role === "super_admin") {
    return ["institute_admin", "teacher", "student"];
  }
  if (role === "institute_admin") {
    return ["teacher", "student"];
  }
  return ["student"];
}

