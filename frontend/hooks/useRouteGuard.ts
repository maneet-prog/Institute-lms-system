"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { getRoleHome } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";

export function useRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const redirectTo = (target: string) => {
      if (target !== pathname) {
        router.replace(target);
      }
    };
    if (!token) {
      redirectTo("/login");
      return;
    }
    if (!role) {
      redirectTo("/login");
      return;
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "super_admin") {
      redirectTo(getRoleHome(role));
    }
    if (pathname.startsWith("/dashboard/institute-admin") && role !== "institute_admin") {
      redirectTo(getRoleHome(role));
    }
    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
      redirectTo(getRoleHome(role));
    }
    if (pathname.startsWith("/dashboard/student") && role !== "student") {
      redirectTo(getRoleHome(role));
    }
  }, [isHydrated, pathname, role, router, token]);

  return { token, role, isHydrated };
}
