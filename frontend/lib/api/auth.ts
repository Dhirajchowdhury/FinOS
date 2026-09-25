import { apiClient } from "./client";
import { User, RequestOtpResponse, VerifyOtpResponse, GoogleAuthUrlResponse } from "@/types/auth";

export const authApi = {
  /**
   * Request a 6-digit email verification code.
   */
  async requestEmailCode(email: string): Promise<RequestOtpResponse> {
    return apiClient<RequestOtpResponse>("/auth/email/request-code", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  /**
   * Verify the 6-digit email OTP and establish an HttpOnly session cookie.
   */
  async verifyEmailCode(email: string, code: string): Promise<VerifyOtpResponse> {
    return apiClient<VerifyOtpResponse>("/auth/email/verify-code", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      }),
    });
  },

  /**
   * Fetch the Google OAuth 2.0 authorization URL.
   */
  async getGoogleAuthUrl(): Promise<GoogleAuthUrlResponse> {
    return apiClient<GoogleAuthUrlResponse>("/auth/google/login");
  },

  /**
   * Fetch the currently authenticated user session via HttpOnly cookie.
   */
  async getCurrentUser(): Promise<User> {
    return apiClient<User>("/auth/me");
  },

  /**
   * Log out the user and clear the session cookie.
   */
  async logout(): Promise<{ message: string }> {
    return apiClient<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },
};
