/**
 * FinOS Base API Client
 * Centralizes all network communication between Next.js and the FastAPI backend.
 */

export const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "/api/backend")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

export class FinOSApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number = 400, data?: any) {
    super(message);
    this.name = "FinOSApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Normalizes HTTP response errors into institutional-grade, user-friendly messages.
 */
function normalizeErrorMessage(status: number, detail?: string): string {
  if (detail) {
    if (detail.toLowerCase().includes("rate limit") || detail.toLowerCase().includes("wait") || status === 429) {
      return detail;
    }
    if (detail.toLowerCase().includes("expired")) {
      return "This verification code has expired. Please request a new code.";
    }
    if (detail.toLowerCase().includes("invalid") || detail.toLowerCase().includes("incorrect")) {
      return detail;
    }
    if (detail.toLowerCase().includes("too many attempts")) {
      return "Too many failed attempts. For your security, this code is now invalid. Please request a new code.";
    }
    return detail;
  }

  switch (status) {
    case 400:
      return "Invalid request parameters. Please verify your input.";
    case 401:
      return "Authentication required. Please sign in to your FinOS account.";
    case 403:
      return "Access denied. Insufficient institutional permissions.";
    case 404:
      return "The requested financial resource or endpoint was not found.";
    case 429:
      return "Rate limit exceeded. Please wait a moment before sending another request.";
    case 500:
    case 502:
    case 503:
      return "FinOS core services are momentarily reconciling. Please try again shortly.";
    default:
      return "An unexpected communication error occurred. Please try again.";
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Required for HttpOnly session cookie transmission
    });

    if (!res.ok) {
      let detail: string | undefined;
      let errorData: any;
      try {
        errorData = await res.json();
        detail = errorData.detail || errorData.message;
      } catch {
        // Non-JSON response
      }
      throw new FinOSApiError(
        normalizeErrorMessage(res.status, detail),
        res.status,
        errorData
      );
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof FinOSApiError) {
      throw err;
    }
    // Network or connection failure
    throw new FinOSApiError(
      "Unable to connect to FinOS backend service. Ensure FastAPI server is operational on port 8000.",
      0
    );
  }
}
