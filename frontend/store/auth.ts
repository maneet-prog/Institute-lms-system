"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { Role } from "@/types/auth";
import { clearAuthCookies, setAuthCookies } from "@/utils/cookies";
import { clearToken, setToken } from "@/utils/storage";

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
        state?.markHydrated();
      }
    }
  )
);
