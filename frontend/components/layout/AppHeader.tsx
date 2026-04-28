"use client";
import { usePathname, useRouter } from "next/navigation";

import { ROLE_HOME } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { AppLink } from "@/components/navigation/AppLink";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  institute_admin: "Institute Admin",
  teacher: "Teacher",
  student: "Student"
} as const;

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const userEmail = useAuthStore((state) => state.userEmail);
  const instituteId = useAuthStore((state) => state.instituteId);
  const logout = useAuthStore((state) => state.logout);
  const startNavigation = useUiStore((state) => state.startNavigation);

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="border-b bg-white">
      <div className="page-shell flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <AppLink href={role ? ROLE_HOME[role] : "/"} className="text-xl font-semibold text-brand-700">
            Institute LMS
          </AppLink>
          {role ? (
            <div className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 md:block">
              {ROLE_LABELS[role]}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <AppLink href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Home
            </AppLink>
            <AppLink href="/features" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Features
            </AppLink>
            <AppLink href="/about" className="rounded-md px-3 py-2 hover:bg-slate-100">
              About
            </AppLink>
            <AppLink href="/contact" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Contact
            </AppLink>
            {role ? (
              <>
                <AppLink href={ROLE_HOME[role]} className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                  {isDashboard ? "Dashboard Home" : "Dashboard"}
                </AppLink>
                <AppLink href="/dashboard/profile" className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                  Profile
                </AppLink>
                {role === "super_admin" ? (
                  <AppLink href="/dashboard/admin/notifications" className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                    Notifications
                  </AppLink>
                ) : null}
              </>
            ) : (
              <>
                <AppLink href="/login" className="rounded-md border px-3 py-1.5 hover:bg-slate-100">
                  Login
                </AppLink>
                <AppLink href="/register" className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700">
                  Register
                </AppLink>
              </>
            )}
          </nav>
          {role ? (
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800">{userEmail ?? "Signed in user"}</p>
                <p>{instituteId ? `Institute ID: ${instituteId}` : "Global admin access"}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  startNavigation();
                  logout();
                  router.replace("/login");
                }}
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
