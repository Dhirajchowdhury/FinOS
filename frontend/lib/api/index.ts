import { authApi } from "./auth";
import { agentsApi } from "./agents";
import { analysisApi } from "./analysis";
import { portfolioApi } from "./portfolio";
import { marketApi } from "./market";
import { reportsApi } from "./reports";
import { API_BASE_URL, FinOSApiError } from "./client";

export const api = {
  // Domain namespaces
  auth: authApi,
  agents: agentsApi,
  analysis: analysisApi,
  portfolio: portfolioApi,
  market: marketApi,
  reports: reportsApi,

  // Direct backwards-compatible methods for existing auth components
  requestEmailCode: authApi.requestEmailCode,
  verifyEmailCode: authApi.verifyEmailCode,
  getGoogleAuthUrl: authApi.getGoogleAuthUrl,
  getCurrentUser: authApi.getCurrentUser,
  logout: authApi.logout,
};

export { API_BASE_URL, FinOSApiError };
export default api;
