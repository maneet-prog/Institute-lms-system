import { Role } from "@/types/auth";

const MAX_AGE_SECONDS = 60 * 60 * 24;

function getSecureAttribute(): string {
  if (typeof window === "undefined") {
    return "; Secure";
  }
  return window.location.protocol === "https:" ? "; Secure" : "";
}

export function setAuthCookies(token: string, role: Role): void {
  if (typeof document === "undefined") {
    return;
  }
  const secureAttribute = getSecureAttribute();
  document.cookie = `lms_token=${encodeURIComponent(token)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Strict${secureAttribute}`;
  document.cookie = `lms_role=${encodeURIComponent(role)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Strict${secureAttribute}`;
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  const secureAttribute = getSecureAttribute();
  document.cookie = `lms_token=; Max-Age=0; Path=/; SameSite=Strict${secureAttribute}`;
  document.cookie = `lms_role=; Max-Age=0; Path=/; SameSite=Strict${secureAttribute}`;
}
