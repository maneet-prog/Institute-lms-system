import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { AppHeader } from "@/components/layout/AppHeader";
import { NavigationOverlay } from "@/components/layout/NavigationOverlay";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Institute LMS",
  description: "Multi-tenant institute LMS with role-based dashboards, batch delivery, and TalentLMS-style service coverage."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppHeader />
          <NavigationOverlay />
          <Toaster />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
