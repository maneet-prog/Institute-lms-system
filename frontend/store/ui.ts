"use client";

import { create } from "zustand";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface UiState {
  isNavigating: boolean;
  toasts: ToastItem[];
  startNavigation: () => void;
  stopNavigation: () => void;
  addToast: (message: string, tone?: ToastTone) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isNavigating: false,
  toasts: [],
  startNavigation: () => set({ isNavigating: true }),
  stopNavigation: () => set({ isNavigating: false }),
  addToast: (message, tone = "info") =>
    set((state) => ({
      toasts: [...state.toasts, { id: `${Date.now()}-${Math.random()}`, message, tone }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));

export function pushToast(message: string, tone: ToastTone = "info") {
  useUiStore.getState().addToast(message, tone);
}

