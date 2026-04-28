type FastApiValidationDetail = {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const first = detail[0] as FastApiValidationDetail | undefined;
      if (first?.msg) {
        return first.msg;
      }
      return "Validation failed. Please check your input.";
    }
  }
  return fallback;
}
