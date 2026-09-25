export type AgentId =
  | "investment"
  | "news"
  | "macro"
  | "risk"
  | "tax"
  | "report"
  | "trading"
  | "fraud"
  | "credit"
  | "portfolio";

export type AgentCategory =
  | "Investment"
  | "Research"
  | "Risk"
  | "Operations"
  | "Security";

export type AgentStatus = "online" | "analyzing" | "idle" | "offline";

export interface Agent {
  id: AgentId;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  shortDescription: string;
  fullDescription: string;
  category: AgentCategory;
  status: AgentStatus;
  accentColor: string;
  model: string;
  latency: string;
  samplePrompt: string;
  color: {
    primary: string;
    bgLight: string;
    bgDark: string;
    borderLight: string;
    borderDark: string;
    text: string;
  };
  iconName: string;
  tags: string[];
  capabilities: string[];
  dataSources: string[];
  modelSpecs: {
    engine: string;
    latency: string;
    contextWindow: string;
    confidenceThreshold: string;
  };
  samplePrompts: string[];
}

export interface AgentMessage {
  id: string;
  agentId: AgentId;
  sender: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  status?: "pending" | "streaming" | "completed" | "error";
  analysisDetails?: {
    toolsUsed?: string[];
    dataSources?: string[];
    reasoningSteps?: string[];
    confidenceScore?: number;
  };
  result?: AgentAnalysisResult;
}

export interface MetricItem {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export interface AgentChartPoint {
  label: string;
  value: number;
  benchmark?: number;
}

export interface AgentAnalysisResult {
  title: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  confidenceScore: number;
  metrics: MetricItem[];
  chartData?: AgentChartPoint[];
  sources: string[];
  explainabilityTrace: {
    decisionPath: string;
    contributingFactors: { factor: string; weight: number }[];
    guardrailsPassed: string[];
  };
  collaboratingAgents?: AgentId[];
}

export interface AgentHistoryItem {
  id: string;
  agentId: AgentId;
  query: string;
  timestamp: string;
  status: "Completed" | "In Review" | "Action Taken";
  confidenceScore: number;
  summary: string;
}
