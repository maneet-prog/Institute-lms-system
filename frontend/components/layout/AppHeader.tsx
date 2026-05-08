"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import logoPng from "../images/logo.png";

import { ROLE_HOME } from "@/constants/routes";
import { useAuthStore } from "@/store/auth";
import { useUiStore } from "@/store/ui";

import { Button } from "@/components/ui/Button";
import { AppLink } from "@/components/navigation/AppLink";
import { Bell } from "lucide-react";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);

  const startNavigation = useUiStore((state) => state.startNavigation);

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-white/60 bg-white/85 backdrop-blur-xl shadow-[0_12px_40px_rgba(15,39,64,0.08)]">
        <div className="page-shell">
          {/* Main Header */}
          <div className="flex h-20 items-center justify-between gap-4">
            {/* ================= LEFT : LOGO ================= */}
            <div className="flex items-center">
              <AppLink
                href={role ? ROLE_HOME[role] : "/"}
                className="flex items-center gap-3"
              >
                <Image
                  src={logoPng}
                  alt="Logo"
                  width={120}
                  height={50}
                  className="h-12 w-auto object-contain"
                  priority
                />
                <div className="hidden sm:block">
                  <p className="text-base font-semibold text-slate-900">TecOnline Campus</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-600">Tajinder&apos;s English Classes</p>
                </div>
              </AppLink>
            </div>

            {/* ================= CENTER : MENU ================= */}
            <nav className="hidden flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
                <AppLink
                  href="/"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Home
                </AppLink>

                <AppLink
                  href="/features"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Programs
                </AppLink>

                <AppLink
                  href="/about"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  About
                </AppLink>

                <AppLink
                  href="/contact"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  Contact
                </AppLink>

                {role && (
                  <>
                    <AppLink
                      href={ROLE_HOME[role]}
                      className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      {isDashboard ? "Dashboard" : "Dashboard"}
                    </AppLink>

                    {role === "super_admin" && (
                      <AppLink
                        href="/dashboard/admin/notifications"
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-brand-100 hover:bg-brand-50"
                      >
                        <Bell className="h-5 w-5" />
                      </AppLink>
                    )}
                  </>
                )}
              </div>
            </nav>

            {/* ================= RIGHT : PROFILE / AUTH ================= */}
            <div className="hidden items-center gap-3 lg:flex">
              {role ? (
                <>
                  <AppLink
                    href="/dashboard/profile"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-100 hover:bg-brand-50"
                  >
                    Profile
                  </AppLink>

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
                </>
              ) : (
                <>
                  <AppLink
                    href="/login"
                    className="rounded-full border border-slate-200 px-5 py-2 font-medium text-slate-700 transition hover:border-brand-100 hover:bg-brand-50"
                  >
                    Login
                  </AppLink>

                  <AppLink
                    href="/register"
                    className="rounded-full bg-[#A93A30] px-5 py-2 font-medium text-white shadow-lg shadow-[#A93A30]/20 transition hover:bg-[#143556]"
                  >
                    Register
                  </AppLink>
                </>
              )}
            </div>

            {/* ================= MOBILE MENU BUTTON ================= */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-slate-700" />
              ) : (
                <Menu className="h-5 w-5 text-slate-700" />
              )}
            </button>
          </div>

          {/* ================= MOBILE MENU ================= */}
          {mobileMenuOpen && (
            <div className="border-t border-slate-200 py-5 lg:hidden">
              <div className="flex flex-col gap-3">
                {/* Menu Links */}
                <nav className="flex flex-col gap-2">
                  <AppLink
                    href="/"
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </AppLink>

                  <AppLink
                    href="/features"
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Programs
                  </AppLink>

                  <AppLink
                    href="/about"
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </AppLink>

                  <AppLink
                    href="/contact"
                    className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </AppLink>

                  {role && (
                    <>
                      <AppLink
                        href={ROLE_HOME[role]}
                        className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </AppLink>

                      {role === "super_admin" && (
                        <AppLink
                          href="/dashboard/admin/notifications"
                          className="rounded-xl px-4 py-3 font-medium text-slate-700 transition hover:bg-brand-50"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Notifications
                        </AppLink>
                      )}
                    </>
                  )}
                </nav>

                {/* Divider */}
                <div className="my-2 h-px bg-slate-200" />

                {/* Auth Section */}
                {role ? (
                  <div className="flex flex-col gap-3">

                    <AppLink
                      href="/dashboard/profile"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </AppLink>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        startNavigation();
                        logout();
                        router.replace("/login");
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <AppLink
                      href="/login"
                      className="rounded-xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </AppLink>

                    <AppLink
                      href="/register"
                      className="rounded-xl bg-[#A93A30] px-4 py-3 text-center font-medium text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </AppLink>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
