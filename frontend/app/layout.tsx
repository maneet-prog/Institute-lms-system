import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { AppChrome } from "@/components/layout/AppChrome";
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
          <AppChrome>{children}</AppChrome>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
