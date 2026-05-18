"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Search, CheckSquare } from "lucide-react";

import { Content, Batch } from "@/types/lms";
import {
  useAssignReusableContentMutation,
  useDeleteReusableContentMutation,
  useReusableModuleContentsQuery,
  useUpdateReusableContentMutation,
  useUsersByInstituteQuery
} from "@/hooks/useLmsQueries";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { saveTecaiPreviewContent } from "@/utils/tecaiPreview";

type EditFormState = {
  title: string;
  type: string;
  description: string;
  external_url: string;
  order_index: number;
  category: string;
  instructions: string;
  response_type: string;
  duration: number;
  attempt_limit: number;
  replace_file: boolean;
  file: File | null;
};

const buildInitialForm = (content: Content): EditFormState => ({
  title: content.title,
  type: content.type,
  description: content.description ?? "",
  external_url: content.external_url ?? "",
  order_index: content.order_index,
  category: content.category ?? "reading",
  instructions: content.instructions ?? "",
  response_type: content.response_type ?? "",
  duration: content.duration,
  attempt_limit: content.quiz?.attempt_limit ?? 0,
  replace_file: false,
  file: null
});

export function ReusableContentLibrary({
  moduleId,
  batches = [],
  instituteId
}: {
  moduleId?: string;
  batches?: Batch[];
  instituteId?: string;
}) {
  const { data = [], isLoading } = useReusableModuleContentsQuery(moduleId);
  const { data: users = [] } = useUsersByInstituteQuery(instituteId);
  
  const deleteContent = useDeleteReusableContentMutation();
  const updateContent = useUpdateReusableContentMutation();
  const assignContent = useAssignReusableContentMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContentIds, setSelectedContentIds] = useState<Set<string>>(new Set());

  // Edit Modal
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetType, setAssignTargetType] = useState<"batches" | "students">("batches");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [targetBatchIds, setTargetBatchIds] = useState<Set<string>>(new Set());
  const [targetStudentIds, setTargetStudentIds] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const validBatchIds = useMemo(() => new Set(batches.map(b => b.batch_id)), [batches]);

  const targetStudents = useMemo(() => {
    return users.filter(
      (u) =>
        u.role_names.includes("student") &&
        u.assigned_batches?.some((b) => validBatchIds.has(b.batch_id))
    );
  }, [users, validBatchIds]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    });
  }, [data, searchQuery]);

  const filteredModalBatches = useMemo(() => {
    const q = modalSearchQuery.toLowerCase();
    return batches.filter(b => b.batch_name.toLowerCase().includes(q));
  }, [batches, modalSearchQuery]);

  const filteredModalStudents = useMemo(() => {
    const q = modalSearchQuery.toLowerCase();
    return targetStudents.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [targetStudents, modalSearchQuery]);

  const generatedPreviewContent =
    selectedContent &&
    form?.type === "quiz" &&
    previewUrl &&
    (form.category === "reading" || form.category === "writing")
      ? {
          ...selectedContent,
          title: form.title || selectedContent.title,
          instructions: form.instructions,
          duration: form.duration,
          file_url: previewUrl,
          quiz: null
        }
      : null;

  const handleBulkAssign = async () => {
    if (!selectedContentIds.size) return;
    if (assignTargetType === "batches" && !targetBatchIds.size) return;
    if (assignTargetType === "students" && !targetStudentIds.size) return;
    
    setIsAssigning(true);

    try {
      const promises = [];
      for (const contentId of selectedContentIds) {
        if (assignTargetType === "batches") {
          for (const batchId of targetBatchIds) {
            promises.push(
              assignContent.mutateAsync({
                contentId,
                payload: {
                  batch_id: batchId,
                  visibility_scope: "batch",
                  assigned_student_ids: [],
                  institute_id: instituteId
                }
              })
            );
          }
        } else {
          const batchToStudents = new Map<string, string[]>();
          for (const studentId of targetStudentIds) {
            const student = targetStudents.find((s) => s.user_id === studentId);
            if (student) {
              const studentBatchIds = student.assigned_batches
                ?.map((b) => b.batch_id)
                .filter((id) => validBatchIds.has(id)) || [];
              for (const bId of studentBatchIds) {
                if (!batchToStudents.has(bId)) batchToStudents.set(bId, []);
                batchToStudents.get(bId)!.push(studentId);
              }
            }
          }

          for (const [batchId, studentIds] of batchToStudents.entries()) {
            promises.push(
              assignContent.mutateAsync({
                contentId,
                payload: {
                  batch_id: batchId,
                  visibility_scope: "selected_students",
                  assigned_student_ids: studentIds,
                  institute_id: instituteId
                }
              })
            );
          }
        }
      }
      await Promise.allSettled(promises);
    } finally {
      setIsAssigning(false);
      setAssignModalOpen(false);
      setSelectedContentIds(new Set());
      setTargetBatchIds(new Set());
      setTargetStudentIds(new Set());
      setModalSearchQuery("");
    }
  };

  const toggleSelectAll = () => {
    if (selectedContentIds.size === filteredData.length) {
      setSelectedContentIds(new Set());
    } else {
      setSelectedContentIds(new Set(filteredData.map((d) => d.content_id)));
    }
  };

  const toggleSelectRow = (contentId: string) => {
    const next = new Set(selectedContentIds);
    if (next.has(contentId)) next.delete(contentId);
    else next.add(contentId);
    setSelectedContentIds(next);
  };

  const toggleTargetBatch = (batchId: string) => {
    const next = new Set(targetBatchIds);
    if (next.has(batchId)) next.delete(batchId);
    else next.add(batchId);
    setTargetBatchIds(next);
  };

  const toggleTargetStudent = (studentId: string) => {
    const next = new Set(targetStudentIds);
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    setTargetStudentIds(next);
  };

  if (!moduleId) {
    return <p className="text-sm text-slate-500">Select a course path and module to manage reusable content.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading reusable content...</p>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search content..."
            className="block w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setAssignModalOpen(true);
            setModalSearchQuery("");
          }}
          disabled={selectedContentIds.size === 0 || batches.length === 0}
        >
          <CheckSquare className="mr-2 inline-block h-4 w-4" />
          Assign Selected ({selectedContentIds.size})
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={filteredData.length > 0 && selectedContentIds.size === filteredData.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredData.length ? (
              filteredData.map((content) => (
                <tr key={content.content_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={selectedContentIds.has(content.content_id)}
                      onChange={() => toggleSelectRow(content.content_id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{content.title}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-brand-50 px-2 py-1 text-xs font-semibold tracking-wider text-brand-700">
                      {content.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{content.category || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <IconButton
                        icon={<Pencil className="h-4 w-4" />}
                        label={`Edit ${content.title}`}
                        onClick={() => {
                          setPreviewUrl(null);
                          setSelectedContent(content);
                          setForm(buildInitialForm(content));
                        }}
                      />
                      {content.type === "quiz" &&
                      (content.category === "reading" ||
                        content.category === "writing" ||
                        content.category === "listening" ||
                        content.category === "speaking") ? (
                        <IconButton
                          icon={<Eye className="h-4 w-4" />}
                          label={`Preview ${content.title}`}
                          onClick={() => window.open(`/exam/${content.content_id}`, "_blank", "noopener,noreferrer")}
                        />
                      ) : null}
                      <IconButton
                        variant="danger"
                        icon={<Trash2 className="h-4 w-4" />}
                        label={`Delete ${content.title}`}
                        onClick={() => deleteContent.mutate({ contentId: content.content_id, moduleId: content.module_id })}
                        disabled={deleteContent.isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                  {searchQuery ? "No content matches your search." : "No reusable content exists for this module yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title="Update Reusable Content"
        open={Boolean(selectedContent && form)}
        onClose={() => {
          setPreviewUrl(null);
          setSelectedContent(null);
          setForm(null);
        }}
      >
        {selectedContent && form ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Title" value={form.title} onChange={(e) => setForm((prev) => (prev ? { ...prev, title: e.target.value } : prev))} />
              <Input label="Duration (minutes)" type="number" value={String(form.duration)} onChange={(e) => setForm((prev) => (prev ? { ...prev, duration: Number(e.target.value) } : prev))} />
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))} />
            <Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm((prev) => (prev ? { ...prev, instructions: e.target.value } : prev))} />
            <Input label="Attempt Limit" type="number" min="0" value={String(form.attempt_limit)} onChange={(e) => setForm((prev) => (prev ? { ...prev, attempt_limit: Math.max(0, Number(e.target.value) || 0) } : prev))} />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={form.replace_file} onChange={(e) => setForm((prev) => (prev ? { ...prev, replace_file: e.target.checked } : prev))} />
                Replace current DOCX/file
              </label>
              <input
                className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  setPreviewUrl(null);
                  setForm((prev) => (prev ? { ...prev, file: e.target.files?.[0] ?? null } : prev));
                }}
              />
            </div>
            {form.type === "quiz" && form.file ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(URL.createObjectURL(form.file as File));
                  }}
                >
                  Generate Local Preview
                </Button>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  updateContent.mutate(
                    {
                      contentId: selectedContent.content_id,
                      payload: {
                        title: form.title,
                        description: form.description,
                        external_url: form.external_url,
                        order_index: form.order_index,
                        category: form.category,
                        instructions: form.instructions,
                        response_type: form.response_type,
                        duration: form.duration,
                        attempt_limit: form.attempt_limit,
                        replace_file: form.replace_file,
                        file: form.file || undefined
                      }
                    },
                    {
                      onSuccess: () => {
                        setSelectedContent(null);
                        setForm(null);
                        setPreviewUrl(null);
                      }
                    }
                  )
                }
                disabled={updateContent.isPending}
              >
                {updateContent.isPending ? "Saving..." : "Save Changes"}
              </Button>
              {generatedPreviewContent ||
              selectedContent.category === "reading" ||
              selectedContent.category === "writing" ||
              selectedContent.category === "speaking" ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (generatedPreviewContent) {
                      const previewKey = saveTecaiPreviewContent(generatedPreviewContent);
                      if (previewKey) {
                        window.open(`/exam/preview?preview_key=${encodeURIComponent(previewKey)}`, "_blank", "noopener,noreferrer");
                      }
                    } else {
                      window.open(`/exam/${selectedContent.content_id}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  {generatedPreviewContent ? "Open Edited Preview" : "Open Current Preview"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Bulk Assign Content"
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
      >
        <div className="flex h-full max-h-[80vh] flex-col overflow-hidden">
          <div className="shrink-0 space-y-4 border-b border-slate-200 pb-4">
            <p className="text-sm text-slate-600">
              Assign the {selectedContentIds.size} selected content item(s) to multiple batches or individual students. If an item is already assigned, it will be automatically skipped.
            </p>
            
            <div className="flex w-full items-center justify-between rounded-lg bg-slate-100 p-1">
              <button
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${assignTargetType === "batches" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                onClick={() => setAssignTargetType("batches")}
              >
                Assign to Batches
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${assignTargetType === "students" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                onClick={() => setAssignTargetType("students")}
              >
                Assign to Students
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center border-b border-slate-200 p-3">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${assignTargetType === "batches" ? "batches" : "students"}...`}
              className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none"
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
            />
          </div>

          <div className="min-h-[200px] flex-1 overflow-y-auto p-2">
            {assignTargetType === "batches" ? (
              <div className="space-y-1">
                {filteredModalBatches.length > 0 ? (
                  filteredModalBatches.map((b) => (
                    <label key={b.batch_id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={targetBatchIds.has(b.batch_id)}
                        onChange={() => toggleTargetBatch(b.batch_id)}
                      />
                      <span className="text-sm font-medium text-slate-900">{b.batch_name}</span>
                    </label>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-slate-500">No batches match your search.</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredModalStudents.length > 0 ? (
                  filteredModalStudents.map((s) => (
                    <label key={s.user_id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        checked={targetStudentIds.has(s.user_id)}
                        onChange={() => toggleTargetStudent(s.user_id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{s.first_name} {s.last_name}</span>
                        <span className="text-xs text-slate-500">{s.email}</span>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-slate-500">No enrolled students match your search.</p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 pt-4 mt-2">
            <Button
              className="w-full"
              disabled={
                (assignTargetType === "batches" && targetBatchIds.size === 0) ||
                (assignTargetType === "students" && targetStudentIds.size === 0) ||
                isAssigning
              }
              onClick={handleBulkAssign}
            >
              {isAssigning 
                ? "Assigning..." 
                : `Assign to ${assignTargetType === "batches" ? targetBatchIds.size : targetStudentIds.size} selected`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
