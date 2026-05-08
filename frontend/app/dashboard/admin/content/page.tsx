"use client";

import { ReusableContentWorkspace } from "@/components/content/ReusableContentWorkspace";

export default function AdminReusableContentPage() {
  return (
    <ReusableContentWorkspace
      badge="Admin Management"
      title="Reusable Content Library"
      description="Create subcourse-wise reusable content, keep it organized by module, and assign it to any matching batch or selected students without rebuilding the same material each time."
    />
  );
}
