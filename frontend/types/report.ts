import { AgentId } from "./agent";

export type ReportType =
  | "Portfolio"
  | "Market"
  | "Risk"
  | "Tax"
  | "Credit"
  | "Multi-Agent"
  | "Executive";

export type ReportStatus = "Ready" | "Generating" | "Scheduled";

export interface ReportItem {
  id: string;
  title: string;
  subtitle: string;
  type: ReportType;
  generatedDate: string;
  contributingAgents: AgentId[];
  status: ReportStatus;
  format: "PDF" | "CSV" | "JSON";
  fileSize: string;
  downloadUrl?: string;
  highlights: string[];
}
