"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Role } from "@/types/auth";
import { decodeJwt } from "@/utils/jwt";
import { clearAuthCookies, setAuthCookies } from "@/utils/cookies";
import { clearToken, getToken, setToken } from "@/utils/storage";

const KNOWN_ROLES = new Set<Role>(["super_admin", "institute_admin", "teacher", "student"]);

function getSessionRole(decodedRoles?: string[], preferredRole?: Role | null): Role | null {
  const normalizedRoles = (decodedRoles ?? []).filter((role): role is Role => KNOWN_ROLES.has(role as Role));
  if (preferredRole && normalizedRoles.includes(preferredRole)) {
    return preferredRole;
  }
  return normalizedRoles[0] ?? null;
}

interface AuthState {
  token: string | null;
  role: Role | null;
  instituteId: string | null;
  userId: string | null;
  userEmail: string | null;
  isHydrated: boolean;
  setSession: (payload: {
    token: string;
    role: Role;
    instituteId?: string;
    userId?: string;
    userEmail?: string;
  }) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      instituteId: null,
      userId: null,
      userEmail: null,
      isHydrated: false,
      setSession: ({ token, role, instituteId, userId, userEmail }) => {
        setToken(token);
        setAuthCookies(token, role);
        set({
          token,
          role,
          instituteId: instituteId ?? null,
          userId: userId ?? null,
          userEmail: userEmail ?? null
        });
      },
      logout: () => {
        clearToken();
        clearAuthCookies();
        set({ token: null, role: null, instituteId: null, userId: null, userEmail: null });
      },
      markHydrated: () => set({ isHydrated: true })
    }),
    {
      name: "lms-auth-state",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const effectiveToken = getToken() || state.token;
        const decoded = effectiveToken ? decodeJwt(effectiveToken) : null;
        const role = getSessionRole(decoded?.roles, state.role);

        if (!effectiveToken || !decoded?.sub || !role) {
          state.logout();
          state.markHydrated();
          return;
        }

        state.setSession({
          token: effectiveToken,
          role,
          instituteId: decoded.institute_id,
          userId: decoded.sub,
          userEmail: effectiveToken === state.token ? state.userEmail ?? undefined : undefined
        });
        state?.markHydrated();
      }
    }
  )
);
