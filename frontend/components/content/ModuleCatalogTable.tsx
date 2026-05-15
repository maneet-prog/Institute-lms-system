"use client";

import { useMemo, useState } from "react";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";

import {
  useCreateModuleSubcategoryMutation,
  useDeleteModuleMutation,
  useDeleteModuleSubcategoryMutation,
  useUpdateModuleMutation,
  useUpdateModuleSubcategoryMutation
} from "@/hooks/useLmsQueries";
import { Course, Module, SubCourse } from "@/types/lms";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface Props {
  modules: Module[];
  courses?: Course[];
  subcourses?: SubCourse[];
  instituteId?: string;
  disableCoursePathSelection?: boolean;
  defaultCourseId?: string;
  defaultSubcourseId?: string;
  canManage?: boolean;
}

export function ModuleCatalogTable({
  modules,
  courses = [],
  subcourses = [],
  instituteId,
  disableCoursePathSelection = false,
  defaultCourseId,
  defaultSubcourseId,
  canManage = true
}: Props) {
  const updateModule = useUpdateModuleMutation();
  const deleteModule = useDeleteModuleMutation();
  const createModuleSubcategory = useCreateModuleSubcategoryMutation();
  const updateModuleSubcategory = useUpdateModuleSubcategoryMutation();
  const deleteModuleSubcategory = useDeleteModuleSubcategoryMutation();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [subcategoryModuleId, setSubcategoryModuleId] = useState<string | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "" });
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [form, setForm] = useState({
    course_id: defaultCourseId ?? "",
    subcourse_id: defaultSubcourseId ?? "",
    module_name: "",
    active: true
  });

  const courseOptions = useMemo(
    () => [{ label: "Select course", value: "" }, ...courses.map((course) => ({ label: course.course_name, value: course.course_id }))],
    [courses]
  );
  const subcourseOptions = useMemo(
    () => [
      { label: "Select subcourse", value: "" },
      ...subcourses
        .filter((entry) => !form.course_id || entry.course_id === form.course_id)
        .map((entry) => ({ label: entry.subcourse_name, value: entry.subcourse_id }))
    ],
    [form.course_id, subcourses]
  );
  const subcategoryModule = useMemo(
    () => modules.find((module) => module.module_id === subcategoryModuleId) ?? null,
    [modules, subcategoryModuleId]
  );

  const openEdit = (module: Module) => {
    setSelectedModule(module);
    setForm({
      course_id: module.course_id,
      subcourse_id: module.subcourse_id,
      module_name: module.module_name,
      active: module.active
    });
  };

  const resetSubcategoryEditor = () => {
    setSubcategoryForm({ name: "" });
    setEditingSubcategoryId(null);
  };

  return (
    <>
      <DataTable
        rows={modules}
        rowKey={(row) => row.module_id}
        initialPageSize={5}
        columns={[
          { key: "module_name", header: "Module" },
          { key: "exam_type", header: "Exam Type", render: (row) => row.exam_type },
          {
            key: "module_subcategories",
            header: "Subcategories",
            render: (row) => row.module_subcategories.map((item) => item.name).join(", ")
          },
          {
            key: "subcourse_name",
            header: "SubCourse",
            render: (row) => subcourses.find((entry) => entry.subcourse_id === row.subcourse_id)?.subcourse_name ?? "Mapped subcourse",
            getFilterValue: (row) => subcourses.find((entry) => entry.subcourse_id === row.subcourse_id)?.subcourse_name ?? ""
          },
          { key: "active", header: "Status", render: (row) => (row.active ? "Active" : "Inactive") },
          {
            key: "actions",
            header: "Actions",
            filterable: false,
            searchable: false,
            render: (row) =>
              canManage ? (
                <div className="flex gap-2">
                  <IconButton
                    icon={<FolderOpen className="h-4 w-4" />}
                    label={`Manage subcategories for ${row.module_name}`}
                    onClick={() => {
                      setSubcategoryModuleId(row.module_id);
                      resetSubcategoryEditor();
                    }}
                  />
                  <IconButton icon={<Pencil className="h-4 w-4" />} label={`Edit ${row.module_name}`} onClick={() => openEdit(row)} />
                  <IconButton
                    variant="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                    label={`Delete ${row.module_name}`}
                    onClick={() => {
                      if (window.confirm(`Delete module "${row.module_name}"?`)) {
                        deleteModule.mutate(row.module_id);
                      }
                    }}
                    disabled={deleteModule.isPending}
                  />
                </div>
              ) : (
                "-"
              )
          }
        ]}
      />

      <Modal title="Update Module" open={Boolean(selectedModule)} onClose={() => setSelectedModule(null)}>
        <div className="space-y-3">
          <Select
            label="Course"
            options={courseOptions}
            value={form.course_id}
            onChange={(event) => setForm((prev) => ({ ...prev, course_id: event.target.value, subcourse_id: "" }))}
            disabled={disableCoursePathSelection}
          />
          <Select
            label="SubCourse"
            options={subcourseOptions}
            value={form.subcourse_id}
            onChange={(event) => setForm((prev) => ({ ...prev, subcourse_id: event.target.value }))}
            disabled={disableCoursePathSelection}
          />
          <Input
            label="Module Name"
            value={form.module_name}
            onChange={(event) => setForm((prev) => ({ ...prev, module_name: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!selectedModule) return;
                updateModule.mutate(
                  {
                    moduleId: selectedModule.module_id,
                    payload: {
                      ...form,
                      institute_id: instituteId
                    }
                  },
                  { onSuccess: () => setSelectedModule(null) }
                );
              }}
              disabled={updateModule.isPending}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setSelectedModule(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={subcategoryModule ? `Manage ${subcategoryModule.module_name} Subcategories` : "Manage Module Subcategories"}
        open={Boolean(subcategoryModule)}
        onClose={() => {
          setSubcategoryModuleId(null);
          resetSubcategoryEditor();
        }}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Keep subcategories tied to this module only. The default <span className="font-semibold text-slate-900">general</span> option is always available and cannot be edited or deleted.
          </div>

          <div className="space-y-3">
            {(subcategoryModule?.module_subcategories || []).map((subcategory) => {
              const isDefault = subcategory.subcategory_id === "general";
              return (
                <div
                  key={subcategory.subcategory_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{subcategory.name}</p>
                    <p className="text-xs text-slate-500">{isDefault ? "Default fallback" : "Custom module subcategory"}</p>
                  </div>
                  {isDefault ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Locked</span>
                  ) : (
                    <div className="flex gap-2">
                      <IconButton
                        icon={<Pencil className="h-4 w-4" />}
                        label={`Edit ${subcategory.name}`}
                        onClick={() => {
                          setEditingSubcategoryId(subcategory.subcategory_id);
                          setSubcategoryForm({ name: subcategory.name });
                        }}
                      />
                      <IconButton
                        variant="danger"
                        icon={<Trash2 className="h-4 w-4" />}
                        label={`Delete ${subcategory.name}`}
                        disabled={deleteModuleSubcategory.isPending}
                        onClick={() => {
                          if (!subcategoryModule) return;
                          if (window.confirm(`Delete subcategory "${subcategory.name}"?`)) {
                            deleteModuleSubcategory.mutate({
                              moduleId: subcategoryModule.module_id,
                              subcategoryId: subcategory.subcategory_id
                            });
                            if (editingSubcategoryId === subcategory.subcategory_id) {
                              resetSubcategoryEditor();
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Input
              label={editingSubcategoryId ? "Update Subcategory Name" : "New Subcategory Name"}
              value={subcategoryForm.name}
              onChange={(event) => setSubcategoryForm({ name: event.target.value })}
            />
            <div className="flex gap-2">
              <Button
                disabled={
                  !subcategoryModule ||
                  !subcategoryForm.name.trim() ||
                  createModuleSubcategory.isPending ||
                  updateModuleSubcategory.isPending
                }
                onClick={() => {
                  if (!subcategoryModule || !subcategoryForm.name.trim()) return;
                  if (editingSubcategoryId) {
                    updateModuleSubcategory.mutate(
                      {
                        moduleId: subcategoryModule.module_id,
                        subcategoryId: editingSubcategoryId,
                        payload: {
                          name: subcategoryForm.name.trim(),
                          institute_id: instituteId
                        }
                      },
                      { onSuccess: resetSubcategoryEditor }
                    );
                    return;
                  }

                  createModuleSubcategory.mutate(
                    {
                      moduleId: subcategoryModule.module_id,
                      payload: {
                        name: subcategoryForm.name.trim(),
                        institute_id: instituteId
                      }
                    },
                    { onSuccess: resetSubcategoryEditor }
                  );
                }}
              >
                {editingSubcategoryId
                  ? updateModuleSubcategory.isPending
                    ? "Saving..."
                    : "Update Subcategory"
                  : createModuleSubcategory.isPending
                    ? "Saving..."
                    : "Add Subcategory"}
              </Button>
              {editingSubcategoryId ? (
                <Button variant="secondary" onClick={resetSubcategoryEditor}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
