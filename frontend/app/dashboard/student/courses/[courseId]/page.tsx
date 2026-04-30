"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppLink } from "@/components/navigation/AppLink";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ContentRenderer } from "@/components/content/ContentRenderer";
import {
  useStudentBatchWorkspaceQuery,
  useSubmitStudentContentMutation
} from "@/hooks/useLmsQueries";

export default function StudentCourseWorkspacePage() {
  const params = useParams<{ courseId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [drafts, setDrafts] = useState<Record<string, { response_text?: string; response_url?: string }>>({});
  const { data, isLoading } = useStudentBatchWorkspaceQuery(params.courseId, selectedCategory);
  const submitResponse = useSubmitStudentContentMutation();

  const categories = useMemo(() => data?.content_categories ?? [], [data]);

  const onFileSelect = (contentId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDrafts((prev) => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          response_url: String(reader.result)
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading course workspace...</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-600">Course workspace not available.</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Student Batch Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold">{data.batch_name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          View only the learning content assigned through your batch and switch categories as needed.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Course Path</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{data.course_name}</p>
            <p className="mt-1 text-sm text-slate-600">{data.subcourse_name}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Learning Categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={selectedCategory ? "secondary" : "primary"} onClick={() => setSelectedCategory(undefined)}>
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "secondary"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </Card>

      {data.modules.map((module) => (
        <Card key={module.module_id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{module.module_name}</h2>
              <p className="mt-1 text-sm text-slate-600">{module.subcourse_name}</p>
            </div>
            <AppLink
              href={`/dashboard/student/modules/${data.batch_id}/${module.module_id}`}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Module Page
            </AppLink>
          </div>
          <div className="mt-4 space-y-4">
            {module.content.map((item) => (
              <div key={item.content_id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-600">{item.category}</p>
                  </div>
                  <div className="text-xs text-slate-500">{item.duration} min</div>
                </div>

                {item.instructions ? <p className="mt-3 text-sm text-slate-600">{item.instructions}</p> : null}

                <div className="mt-4">
                  <ContentRenderer content={item} />
                </div>

                {item.downloadable && (item.resolved_url || item.url) ? (
                  <a
                    href={item.resolved_url ?? item.url ?? "#"}
                    download
                    className="mt-3 block text-sm text-slate-600 hover:text-brand-700"
                  >
                    Download file
                  </a>
                ) : null}

                {item.category === "writing" ? (
                  <div className="mt-4 space-y-3">
                    <textarea
                      className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
                      placeholder="Write your response here"
                      value={drafts[item.content_id]?.response_text ?? item.submission?.response_text ?? ""}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.content_id]: {
                            ...prev[item.content_id],
                            response_text: event.target.value
                          }
                        }))
                      }
                    />
                    <Button
                      onClick={() =>
                        submitResponse.mutate({
                          content_id: item.content_id,
                          response_type: item.response_type || "text",
                          response_text: drafts[item.content_id]?.response_text ?? ""
                        })
                      }
                    >
                      Submit Writing
                    </Button>
                  </div>
                ) : null}

                {item.category === "speaking" ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="file"
                      accept={item.response_type === "video" ? "video/*" : "audio/*,video/*"}
                      onChange={(event) => onFileSelect(item.content_id, event)}
                    />
                    {drafts[item.content_id]?.response_url || item.submission?.response_url ? (
                      <p className="text-sm text-slate-600">Media selected and ready to submit.</p>
                    ) : null}
                    <Button
                      onClick={() =>
                        submitResponse.mutate({
                          content_id: item.content_id,
                          response_type: item.response_type || "audio",
                          response_url: drafts[item.content_id]?.response_url ?? item.submission?.response_url ?? ""
                        })
                      }
                    >
                      Submit Speaking Response
                    </Button>
                  </div>
                ) : null}

                {item.submission ? (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                    <p>Submitted on {new Date(item.submission.submitted_at).toLocaleString("en-IN")}</p>
                    <p>
                      Status: {item.submission.review_status} | Latest marks:{" "}
                      {item.submission.latest_awarded_marks ?? item.submission.latest_auto_score}/{item.submission.max_score}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
