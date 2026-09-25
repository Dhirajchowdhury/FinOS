export interface User {
  id: number;
  email: string;
  name: string | null;
  google_id: string | null;
  created_at: string;
  last_login: string | null;
  is_verified: boolean;
}

export type AuthStep = "EMAIL_INPUT" | "OTP_VERIFY";

export interface RequestOtpResponse {
  message: string;
  cooldown_seconds?: number;
}

export interface VerifyOtpResponse {
  message: string;
  user: User;
}

export interface GoogleAuthUrlResponse {
  auth_url: string;
}

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}
