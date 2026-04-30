"use client";

import { useState } from "react";

import { AppLink } from "@/components/navigation/AppLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  useMarkProgressMutation,
  useProgressQuery,
  useStudentModulesQuery
} from "@/hooks/useLmsQueries";

export default function StudentModulesPage() {
  const { data: modules = [], isLoading } = useStudentModulesQuery();
  const { data: progress = [] } = useProgressQuery({ refetchInterval: 15000 });
  const markProgress = useMarkProgressMutation();
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const getProgressValue = (moduleId: string) =>
    progress.find((item) => item.module_id === moduleId)?.progress_percent ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold">Student: Modules & Content</h1>
        <p className="mt-2 text-sm text-slate-600">Learn content and track module completion progress.</p>
      </Card>

      {isLoading ? <p>Loading modules...</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {modules.map((module) => (
          <Card key={`${module.batch_id}-${module.module_id}`}>
            <h2 className="text-lg font-semibold">{module.module_name}</h2>
            <p className="text-xs text-slate-500">{module.batch_name} | {module.module_id}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{module.content.length} content items available in this module.</p>
              <p>
                Topics:{" "}
                {module.content
                  .map((item) => item.title)
                  .slice(0, 3)
                  .join(", ")}
                {module.content.length > 3 ? "..." : ""}
              </p>
            </div>
            <div className="mt-4">
              <ProgressBar value={getProgressValue(module.module_id)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <AppLink
                href={`/dashboard/student/modules/${module.batch_id}/${module.module_id}`}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Open Module Details
              </AppLink>
              <Button
                onClick={() => {
                  setActiveModuleId(module.module_id);
                  markProgress.mutate({
                    module_id: module.module_id,
                    completed: true,
                    progress_percent: 100
                  });
                }}
                disabled={markProgress.isPending && activeModuleId === module.module_id}
              >
                Mark Complete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
