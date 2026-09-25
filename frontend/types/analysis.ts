import { AgentId } from "./agent";

export interface AgentSignal {
  agentId: AgentId;
  agentName: string;
  verdict: "Bullish" | "Neutral" | "Bearish" | "High Risk" | "Low Risk" | "Rebalance Required" | "Optimized";
  confidence: number;
  finding: string;
  rationale: string;
  timestamp: string;
  dataPoint: string;
}

export interface CrossAgentSignalMatrix {
  sourceAgent: AgentId;
  targetAgent: AgentId;
  signalType: "validation" | "conflict" | "amplification" | "neutral";
  description: string;
  weight: number;
}

export interface MultiAgentScenario {
  id: string;
  title: string;
  description: string;
  category: "Macroeconomic" | "Earnings & Tech" | "Risk & Drawdown" | "Regulatory & Tax";
  involvedAgentIds: AgentId[];
  userPrompt: string;
  signals: AgentSignal[];
  conflictResolution?: {
    conflictDescription: string;
    resolutionExplanation: string;
    reconciledScore: number;
  };
  consensusVerdict: string;
  consensusScore: number; // 0 - 100
  riskLevel: "Low" | "Moderate" | "High" | "Severe";
  unifiedInsights: string[];
  actionPlan: {
    immediate: string[];
    mediumTerm: string[];
  };
  explainability: {
    graphRAGContext: string;
    decisionEngineWeighting: { agent: string; weight: number }[];
    auditId: string;
  };
}

export interface MultiAgentRunProgress {
  step: "initiating" | "routing" | "collaborating" | "resolving" | "synthesizing" | "completed";
  activeAgentId?: AgentId;
  progressPercent: number;
  currentActivity: string;
}

export interface AnalysisHistoryRecord {
  id: string;
  title: string;
  query: string;
  type: "Stocks" | "Markets" | "Portfolio" | "Risk" | "Tax" | "Payslip" | "Reports" | "Credit" | "Fraud";
  agentsUsed: string[];
  date: string;
  timestamp: string;
  status: "Completed" | "Processing" | "Archived";
  summary: string;
  keyFindings: string[];
  marketInfo?: {
    symbol?: string;
    price?: string;
    change?: string;
    peRatio?: string;
    marketCap?: string;
    volume?: string;
  };
  news?: {
    headline: string;
    sentiment: "Positive" | "Neutral" | "Negative";
    source: string;
    time: string;
  }[];
  riskFactors: {
    factor: string;
    impact: "High" | "Medium" | "Low";
    description: string;
  }[];
  investmentInsights: string[];
  agentContributions: {
    agent: string;
    role: string;
    insight: string;
    confidence: number;
  }[];
  suggestedActions: string[];
}

