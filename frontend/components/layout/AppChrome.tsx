"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { NavigationOverlay } from "@/components/layout/NavigationOverlay";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/exam");

  return (
    <>
      {hideChrome ? null : (
        <>
          <AppHeader />
          <NavigationOverlay />
        </>
      )}
      <main>{children}</main>
    </>
  );
}
