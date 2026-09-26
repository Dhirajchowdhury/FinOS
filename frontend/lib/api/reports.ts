import { apiClient, API_BASE_URL } from "./client";

export interface RealReportItem {
  id: string;
  request: string;
  entity_id: string;
  market?: string;
  as_of_date?: string;
  created_at: string;
  status: string;
}

export interface RealReportDetail extends RealReportItem {
  final_report?: string;
  state?: Record<string, any>;
}

export const reportsApi = {
  async getReports(): Promise<RealReportItem[]> {
    return apiClient<RealReportItem[]>("/reports");
  },

  async getReportDetail(id: string): Promise<RealReportDetail> {
    return apiClient<RealReportDetail>(`/reports/${id}`);
  },

  getPdfUrl(id: string): string {
    return `${API_BASE_URL}/reports/${id}/pdf`;
  },

  getCsvUrl(id: string): string {
    return `${API_BASE_URL}/reports/${id}/csv`;
  },

  async downloadFile(url: string, filename: string): Promise<void> {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
};
