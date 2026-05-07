import type { Metadata } from "next";

import { Providers } from "@/app/providers";
import { AppChrome } from "@/components/layout/AppChrome";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "TecOnline Campus",
  description: "TecOnline Campus by Tajinder's English Classes for coaching delivery, exam practice, learner progress, and branch operations."
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
