import axios from "axios";

import { useAuthStore } from "@/store/auth";
import { pushToast } from "@/store/ui";
import { getToken } from "@/utils/storage";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const useNgrokBypassHeader = /ngrok/i.test(baseURL);

export const api = axios.create({
  baseURL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? useAuthStore.getState().token ?? getToken() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (useNgrokBypassHeader) {
    config.headers["ngrok-skip-browser-warning"] = "69420";
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.code === "ECONNABORTED"
        ? "The request took too long. Please try again."
        :
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong.";
    pushToast(String(message), "error");
    return Promise.reject(error);
  }
);
