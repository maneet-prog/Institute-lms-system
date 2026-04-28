"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useUiStore } from "@/store/ui";

export function NavigationOverlay() {
  const pathname = usePathname();
  const isNavigating = useUiStore((state) => state.isNavigating);
  const stopNavigation = useUiStore((state) => state.stopNavigation);

  useEffect(() => {
    stopNavigation();
  }, [pathname, stopNavigation]);

  if (!isNavigating) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="rounded-2xl border border-brand-100 bg-white px-6 py-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Loading</p>
        <p className="mt-2 text-sm text-slate-700">Opening the next page...</p>
      </div>
    </div>
  );
}

