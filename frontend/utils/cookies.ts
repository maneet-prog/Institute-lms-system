import { Role } from "@/types/auth";

const MAX_AGE_SECONDS = 60 * 60 * 24;

export function setAuthCookies(token: string, role: Role): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `lms_token=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Strict; Secure`;
  document.cookie = `lms_role=${encodeURIComponent(role)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Strict; Secure`;
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = "lms_token=; Max-Age=0; Path=/; SameSite=Strict; Secure";
  document.cookie = "lms_role=; Max-Age=0; Path=/; SameSite=Strict; Secure";
}
