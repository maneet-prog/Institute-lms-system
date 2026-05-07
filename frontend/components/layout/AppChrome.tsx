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
      <main className={hideChrome ? "" : "relative"}>{children}</main>
      {hideChrome ? null : (
        <footer className="mt-10 border-t border-white/60 bg-[#A93A30] text-white">
          <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f0b44c]">TecOnline Campus</p>
              <h2 className="mt-3 text-2xl font-semibold">Unlock your global opportunities with Tajinder&apos;s English Classes.</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                A unified platform for language coaching, exam preparation, learner tracking, assignments, and daily academic operations.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f0b44c]">Popular Programs</p>
              <div className="mt-4 space-y-2 text-sm text-slate-300 gap-2 flex flex-col">
                <a href="https://teconline.in/e/ielts_preparation" target="_blank" rel="noopener noreferrer">
                  <p>IELTS Preparation</p>
                </a>
                <a href="https://teconline.in/e/pearson_test_of_english" target="_blank" rel="noopener noreferrer">
                  <p>PTE</p>
                </a>
                <a href="https://teconline.in/e/celpip" target="_blank" rel="noopener noreferrer">
                  <p>CELPIP</p>
                </a>
                <a href="https://teconline.in/e/toefl" target="_blank" rel="noopener noreferrer">
                  <p>TOEFL</p>
                </a>
                <a href="https://teconline.in/e/spoken_english" target="_blank" rel="noopener noreferrer">
                  <p>Spoken English</p>
                </a>
                <a href="https://teconline.in/e/french_language" target="_blank" rel="noopener noreferrer">
                  <p>French Language</p>
                </a>
                <a href="https://teconline.in/e/duolingo_english_test" target="_blank" rel="noopener noreferrer">
                  <p>Duolingo English Test</p>
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f0b44c]">Contact</p>
              <div className="mt-4 space-y-2 text-sm leading-7 text-slate-300">
                <a href="mailto:info@teconline.in"><p>info@teconline.in</p></a>
                <p>9814115132, 9914915132</p>
                <p>Mon - Sat, 8am - 6pm</p>
                <p>SCF 47, above Canara Bank, Phase 7, Sector 61, Sahibzada Ajit Singh Nagar, Punjab 160062, India</p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
