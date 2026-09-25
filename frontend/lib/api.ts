import { User, RequestOtpResponse, VerifyOtpResponse, GoogleAuthUrlResponse } from "@/types/auth";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
// Normalize localhost to 127.0.0.1 to prevent Windows IPv6 [::1] connection refused
export const API_BASE_URL = RAW_API_URL.replace("://localhost:", "://127.0.0.1:");

/**
 * Custom application error with user-friendly formatting.
 */
export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

/**
 * Normalizes HTTP response errors into clean, professional fintech messages.
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
      return "Invalid request. Please check your information.";
    case 401:
      return "Session expired or unauthorized. Please log in again.";
    case 403:
      return "Access denied.";
    case 404:
      return "Service or resource not found.";
    case 429:
      return "Too many requests. Please wait before requesting another code.";
    case 500:
    case 502:
    case 503:
      return "Unable to process request right now. Please try again in a moment.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Essential for HttpOnly session cookies
    });

    if (!res.ok) {
      let detail: string | undefined;
      try {
        const errorData = await res.json();
        detail = errorData.detail || errorData.message;
      } catch {
        // Response wasn't JSON
      }
      throw new AuthApiError(normalizeErrorMessage(res.status, detail), res.status);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof AuthApiError) {
      throw err;
    }
    // Network or connection failure
    throw new AuthApiError("Unable to connect to the authentication server. Please ensure the backend is running.", 0);
  }
}

export const api = {
  /**
   * Request a 6-digit OTP sent to the given email address.
   */
  async requestEmailCode(email: string): Promise<RequestOtpResponse> {
    return request<RequestOtpResponse>("/auth/email/request-code", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  /**
   * Verify the 6-digit OTP. Sets HttpOnly session cookie on success.
   */
  async verifyEmailCode(email: string, code: string): Promise<VerifyOtpResponse> {
    return request<VerifyOtpResponse>("/auth/email/verify-code", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });
  },

  /**
   * Get the Google OAuth authorization URL.
   */
  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
    return request<GoogleAuthUrlResponse>("/auth/google/login");
  },

  /**
   * Fetch currently authenticated user session.
   */
  async getCurrentUser(): Promise<User> {
    return request<User>("/auth/me");
  },

  /**
   * Log out and clear the session cookie.
   */
  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },
};
