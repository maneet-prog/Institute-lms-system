"use client";

import { PropsWithChildren } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export function ProtectedLayout({ children }: PropsWithChildren) {
  const { isHydrated, token } = useRouteGuard();

  if (!isHydrated || !token) {
    return <div className="page-shell text-sm text-slate-600">Loading...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] lg:flex">
      <Sidebar />
      <section className="flex-1 p-4 lg:p-6">{children}</section>
    </div>
  );
}
