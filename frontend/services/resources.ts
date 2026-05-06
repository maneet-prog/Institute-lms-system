import { api } from "@/services/client";

export async function assignResource(payload: { user_id: string; content_id: string }) {
  const { data } = await api.post("/resources/assign", {
    userId: payload.user_id,
    contentId: payload.content_id
  });
  return data;
}

export async function removeResource(payload: { user_id: string; content_id: string }) {
  const { data } = await api.post("/resources/remove", {
    userId: payload.user_id,
    contentId: payload.content_id
  });
  return data;
}
