"use client";

import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
    <section className="page-shell">
      <Card>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use this page for tenant-level frontend configuration (theme, API endpoints, preferences).
        </p>
      </Card>
    </section>
  );
}
