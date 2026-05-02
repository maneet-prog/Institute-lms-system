import { Content } from "@/types/lms";

const TECAI_PREVIEW_PREFIX = "tecai-preview:";

export function saveTecaiPreviewContent(content: Content): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(`${TECAI_PREVIEW_PREFIX}${key}`, JSON.stringify(content));
  return key;
}

export function loadTecaiPreviewContent(key: string): Content | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(`${TECAI_PREVIEW_PREFIX}${key}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Content;
  } catch {
    return null;
  }
}
