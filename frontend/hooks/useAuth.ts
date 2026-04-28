"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { getRoleHome } from "@/constants/routes";
import { loginUser, registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { LoginPayload, RegisterPayload, Role } from "@/types/auth";
import { decodeJwt } from "@/utils/jwt";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload)
  });
}

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const startNavigation = useUiStore((state) => state.startNavigation);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (data, variables) => {
      const decoded = decodeJwt(data.access_token);
      const decodedRole = decoded?.roles?.[0] as Role | undefined;
      const role: Role = decodedRole && decodedRole in { super_admin: 1, institute_admin: 1, teacher: 1, student: 1 }
        ? decodedRole
        : "student";
      setSession({
        token: data.access_token,
        role,
        instituteId: decoded?.institute_id,
        userId: decoded?.sub,
        userEmail: variables.email
      });
      startNavigation();
      router.replace(getRoleHome(role));
    }
  });
}
