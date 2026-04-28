"use client";
import { usePathname, useRouter } from "next/navigation";

import { NAV_BY_ROLE } from "@/constants/navigation";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";
import { Button } from "@/components/ui/Button";
import { AppLink } from "@/components/navigation/AppLink";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const startNavigation = useUiStore((state) => state.startNavigation);

  const navGroups = role ? NAV_BY_ROLE[role] : [];

  return (
    <aside className="w-full border-r bg-white p-4 lg:w-80">
      <div className="mb-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Admin Panel</p>
        <h2 className="mt-2 text-lg font-semibold text-brand-700">Management Console</h2>
        <p className="mt-1 text-sm text-slate-600">Navigate institute records, courses, subcourses, and users.</p>
      </div>

      <nav className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <AppLink
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl border px-3 py-3 text-sm transition ${
                      isActive
                        ? "border-brand-200 bg-brand-50 text-brand-700 shadow-sm"
                        : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-medium">{item.label}</span>
                    {item.description ? (
                      <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                    ) : null}
                  </AppLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <Button
        variant="secondary"
        className="mt-8 w-full"
        onClick={() => {
          startNavigation();
          logout();
          router.replace("/login");
        }}
      >
        Logout
      </Button>
    </aside>
  );
}
