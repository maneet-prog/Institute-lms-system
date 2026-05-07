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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#A93A30]/18 backdrop-blur-sm">
      <div className="rounded-[1.75rem] border border-white/70 bg-white/90 px-6 py-5 shadow-2xl shadow-[#A93A30]/10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">TecOnline</p>
        <p className="mt-2 text-sm text-slate-700">Opening the next page...</p>
      </div>
    </div>
  );
}
