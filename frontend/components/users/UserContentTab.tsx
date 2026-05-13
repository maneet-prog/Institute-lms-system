"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  useBatchesQuery,
  useModulesQuery,
  useCreateUserContentMutation,
  useUpdateUserContentMutation,
  useDeleteUserContentMutation
} from "@/hooks/useLmsQueries";
import { useAuthStore } from "@/store/auth";
import { Plus, Edit, Trash2, FileText, Video, Image, Music, File, ExternalLink, Calendar } from "lucide-react";

interface UserContentTabProps {
  userId: string;
  content: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    file_url: string | null;
    external_url: string | null;
    order_index: number;
    duration: number;
    visibility_scope: string;
    created_at: string;
    module_id: string;
    module_name: string;
    batch_id: string | null;
    batch_name: string | null;
    created_by: string | null;
  }>;
  userRoles: string[];
}

const contentTypeIcons = {
  text: FileText,
  video: Video,
  audio: Music,
  pdf: File,
  document: File,
  image: Image,
  quiz: FileText
};

const contentTypeOptions = [
  { value: "text", label: "Text" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Document" },
  { value: "image", label: "Image" },
  { value: "quiz", label: "Quiz" }
];

export function UserContentTab({ userId, content, userRoles }: UserContentTabProps) {
  const instituteId = useAuthStore((state) => state.instituteId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<UserContentTabProps["content"][number] | null>(null);
  const [form, setForm] = useState({
    batch_id: "",
    module_id: "",
    type: "text",
    title: "",
    description: "",
    external_url: "",
    order_index: 0,
    duration: 0,
    visibility_scope: "batch"
  });

  const { data: availableBatches = [] } = useBatchesQuery(instituteId ?? undefined);
  const { data: availableModules = [] } = useModulesQuery({ institute_id: instituteId ?? undefined });

  const createContent = useCreateUserContentMutation();
  const updateContent = useUpdateUserContentMutation();
  const deleteContent = useDeleteUserContentMutation();

  const isTeacher = userRoles.includes("teacher");

  const resetForm = () => {
    setForm({
      batch_id: "",
      module_id: "",
      type: "text",
      title: "",
      description: "",
      external_url: "",
      order_index: 0,
      duration: 0,
      visibility_scope: "batch"
    });
  };

  const handleCreate = async () => {
    if (!form.title || !form.batch_id || !form.module_id) return;

    try {
      await createContent.mutateAsync({
        userId,
        title: form.title,
        description: form.description,
        content_type: form.type,
        content_data: {
          external_url: form.external_url,
          order_index: form.order_index,
          duration: form.duration,
          visibility_scope: form.visibility_scope
        },
        module_id: form.module_id,
        batch_id: form.batch_id
      });
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create content:", error);
    }
  };

  const handleUpdate = async () => {
    if (!editingContent || !form.title) return;

    try {
      await updateContent.mutateAsync({
        userId,
        contentId: editingContent.id,
        title: form.title,
        description: form.description,
        content_data: {
          external_url: form.external_url,
          order_index: form.order_index,
          duration: form.duration,
          visibility_scope: form.visibility_scope
        }
      });
      setEditingContent(null);
      resetForm();
    } catch (error) {
      console.error("Failed to update content:", error);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (confirm("Are you sure you want to delete this content?")) {
      try {
        await deleteContent.mutateAsync({ userId, contentId });
      } catch (error) {
        console.error("Failed to delete content:", error);
      }
    }
  };

  const openEditModal = (contentItem: UserContentTabProps["content"][number]) => {
    setEditingContent(contentItem);
    setForm({
      batch_id: contentItem.batch_id || "",
      module_id: contentItem.module_id || "",
      type: contentItem.type,
      title: contentItem.title,
      description: contentItem.description || "",
      external_url: contentItem.external_url || "",
      order_index: contentItem.order_index || 0,
      duration: contentItem.duration || 0,
      visibility_scope: contentItem.visibility_scope || "batch"
    });
  };

  if (!isTeacher) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Content management is only available for teachers</p>
          </div>
        </Card>

        {/* Display assigned content for students */}
        {content.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Assigned Content</h3>
            <div className="grid gap-4">
              {content.map((item) => {
                const IconComponent = contentTypeIcons[item.type as keyof typeof contentTypeIcons] || FileText;
                return (
                  <Card key={item.id}>
                    <div className="flex items-start gap-3">
                      <IconComponent className="w-5 h-5 mt-1 text-gray-500" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{item.module_name}</span>
                          {item.batch_name && <span>{item.batch_name}</span>}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {item.type}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Content
        </Button>
      </div>

      {/* Content List */}
      {content.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No content created yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {content.map((item) => {
            const IconComponent = contentTypeIcons[item.type as keyof typeof contentTypeIcons] || FileText;
            return (
              <Card key={item.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className="w-5 h-5 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{item.module_name}</span>
                        {item.batch_name && <span>{item.batch_name}</span>}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant="secondary">{item.visibility_scope}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showCreateModal || !!editingContent}
        onClose={() => {
          setShowCreateModal(false);
          setEditingContent(null);
          resetForm();
        }}
        title={editingContent ? "Edit Content" : "Create Content"}
      >
        <div className="space-y-4">
          <Select
            label="Batch"
            value={form.batch_id}
            onChange={(e) => setForm((prev) => ({ ...prev, batch_id: e.target.value }))}
            options={availableBatches.map((batch) => ({
              value: batch.batch_id,
              label: batch.batch_name
            }))}
          />

          <Select
            label="Module"
            value={form.module_id}
            onChange={(e) => setForm((prev) => ({ ...prev, module_id: e.target.value }))}
            options={availableModules.map((module) => ({
              value: module.module_id,
              label: module.module_name
            }))}
          />

          <Select
            label="Content Type"
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            options={contentTypeOptions}
          />

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Content title"
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Content description"
            rows={3}
          />

          <Input
            label="External URL"
            value={form.external_url}
            onChange={(e) => setForm(prev => ({ ...prev, external_url: e.target.value }))}
            placeholder="https://example.com"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Order Index"
              type="number"
              value={form.order_index}
              onChange={(e) => setForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
            />

            <Input
              label="Duration (seconds)"
              type="number"
              value={form.duration}
              onChange={(e) => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <Select
            label="Visibility Scope"
            value={form.visibility_scope}
            onChange={(e) => setForm((prev) => ({ ...prev, visibility_scope: e.target.value }))}
            options={[
              { value: "batch", label: "Batch Only" },
              { value: "selected_students", label: "Selected Students" }
            ]}
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setEditingContent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingContent ? handleUpdate : handleCreate}
              disabled={!form.title || !form.batch_id || !form.module_id || createContent.isPending || updateContent.isPending}
            >
              {createContent.isPending || updateContent.isPending
                ? (editingContent ? "Updating..." : "Creating...")
                : (editingContent ? "Update" : "Create")
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}