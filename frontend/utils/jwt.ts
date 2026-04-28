import { Role } from "@/types/auth";

export interface TokenPayload {
  sub: string;
  institute_id?: string;
  roles?: Role[];
  exp?: number;
}

export function decodeJwt(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}
