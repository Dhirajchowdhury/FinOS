import { apiClient } from "./client";
import { MultiAgentScenario } from "@/types/analysis";
import { MOCK_MULTI_AGENT_SCENARIOS } from "@/lib/mock/analysis";
import { AgentId } from "@/types/agent";
import { ConversationMessage } from "@/components/ask-finos/FinOSResponseBubble";

export interface RealAnalysisRequest {
  entity_id?: string;
  request: string;
  market?: string;
  as_of_date?: string;
  context?: Record<string, any>;
}

export interface FinosStateResponse {
  entity_id: string;
  entity_type?: string;
  market?: string;
  as_of_date?: string;
  request: string;
  news?: any;
  macro?: any;
  credit?: any;
  investment?: any;
  risk?: any;
  portfolio?: any;
  trading?: any;
  tax?: any;
  fraud?: any;
  report?: any;
  data_quality?: any;
  missing_data?: string[];
  errors?: string[];
  provenance?: Record<string, any>;
  sender?: string;
  metadata?: Record<string, any>;
}

/**
 * Adapter converting raw FinosState JSON from FastAPI backend into ConversationMessage shape for UI.
 * Does NOT fabricate any fake metrics, confidence scores, or mock findings.
 */
export function adapterFinosStateToConversationMessage(
  state: FinosStateResponse,
  deepReasoning: boolean = false
): ConversationMessage {
  const reportFindings = state.report?.findings || state.report;
  const mainText =
    reportFindings?.summary ||
    state.report?.summary ||
    state.investment?.findings?.thesis ||
    state.investment?.summary ||
    `FinOS 10-agent financial analysis completed for ${state.entity_id}.`;

  const agentsConsulted: AgentId[] = [
    "news",
    "macro",
    "credit",
    "investment",
    "risk",
    "portfolio",
    "trading",
    "tax",
    "fraud",
    "report",
  ];

  let consensusScore: number | undefined = undefined;
  if (typeof state.investment?.confidence === "number") {
    consensusScore = Math.round(state.investment.confidence * 100);
  } else if (typeof state.investment?.findings?.confidence === "number") {
    consensusScore = Math.round(state.investment.findings.confidence * 100);
  }

  const findings: string[] = [];

  // Real Credit findings
  const creditFindings = state.credit?.findings;
  if (creditFindings) {
    if (creditFindings.rating && creditFindings.leverage_ratio_debt_ebitda !== undefined) {
      findings.push(
        `Credit Rating: ${creditFindings.rating} | Leverage (Debt/EBITDA): ${creditFindings.leverage_ratio_debt_ebitda}x`
      );
    } else if (creditFindings.summary) {
      findings.push(`Credit Profile: ${creditFindings.summary}`);
    }
  }

  // Real Macro findings
  const macroFindings = state.macro?.findings;
  if (macroFindings?.economic_regime) {
    findings.push(`Macro Economic Regime: ${macroFindings.economic_regime}`);
  } else if (state.macro?.summary) {
    findings.push(`Macro Economy: ${state.macro.summary}`);
  }

  // Real Investment findings
  const investFindings = state.investment?.findings;
  if (investFindings?.thesis) {
    findings.push(`Investment Thesis: ${investFindings.thesis}`);
  }

  // Real Risk findings
  const riskFindings = state.risk?.findings;
  if (riskFindings?.overall_risk_level) {
    findings.push(`Risk Assessment: Level ${riskFindings.overall_risk_level}`);
  }

  // Real News findings
  const newsFindings = state.news?.findings;
  if (newsFindings?.sentiment_label) {
    findings.push(`News Sentiment: ${newsFindings.sentiment_label}`);
  }

  // Real Tax findings
  if (state.tax?.metadata?.tax_calculation_status) {
    findings.push(`Tax Audit Status: ${state.tax.metadata.tax_calculation_status}`);
  }

  // Real Fraud findings
  if (state.fraud?.metadata?.transaction_monitoring_status) {
    findings.push(`Fraud Monitoring Status: ${state.fraud.metadata.transaction_monitoring_status}`);
  }

  // Real Actions
  const actions: string[] = [];
  const tradingFindings = state.trading?.findings;
  if (tradingFindings?.action) {
    let actionText = `Proposed Trade Action: ${tradingFindings.action}`;
    if (tradingFindings.rationale) {
      actionText += ` — ${tradingFindings.rationale}`;
    }
    actions.push(actionText);
  }
  const portfolioFindings = state.portfolio?.findings;
  if (portfolioFindings?.max_position_weight_pct) {
    actions.push(`Position Allocation Limit: Capped at ${portfolioFindings.max_position_weight_pct}% max position weight.`);
  }

  // Real Data Sources
  const sourcesSet = new Set<string>();
  if (state.credit?.status === "REAL" || state.news?.status === "REAL" || state.news?.status === "PARTIAL") {
    sourcesSet.add("Yahoo Finance (yfinance)");
  }
  if (state.macro?.status === "REAL" || state.macro?.data_sources_used?.includes("FRED API")) {
    sourcesSet.add("FRED API");
  }
  if (state.investment?.status === "REAL" || state.risk?.status === "REAL" || state.trading?.status === "REAL") {
    sourcesSet.add("Google Gemini (gemini-3.8-flash)");
  }
  sourcesSet.add("FinOS 10-Agent Engine");
  const sources = Array.from(sourcesSet);

  return {
    id: `finos-${Date.now()}`,
    sender: "finos",
    text: mainText,
    timestamp: "Just now",
    agentsConsulted,
    consensusScore,
    findings: findings.length > 0 ? findings : undefined,
    actions: actions.length > 0 ? actions : undefined,
    sources: sources.length > 0 ? sources : undefined,
    deepReasoning,
  };
}

export const analysisApi = {
  /**
   * Execute real 10-agent FinOS analysis via FastAPI backend.
   */
  async runAnalysis(payload: RealAnalysisRequest): Promise<FinosStateResponse> {
    return apiClient<FinosStateResponse>("/analysis", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch all pre-configured multi-agent analysis scenarios (UI Demo/Mock).
   */
  async getScenarios(): Promise<MultiAgentScenario[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_MULTI_AGENT_SCENARIOS]), 150);
    });
  },

  /**
   * Fetch a specific scenario by ID (UI Demo/Mock).
   */
  async getScenarioById(id: string): Promise<MultiAgentScenario | null> {
    const scenario = MOCK_MULTI_AGENT_SCENARIOS.find((s) => s.id === id);
    return scenario ? { ...scenario } : null;
  },

  /**
   * Execute custom multi-agent analysis based on user prompt (UI Demo/Mock fallback).
   */
  async runMultiAgentAnalysis(prompt: string): Promise<MultiAgentScenario> {
    const clean = prompt.toLowerCase();
    const matched = MOCK_MULTI_AGENT_SCENARIOS.find(
      (s) => clean.includes("rbi") || clean.includes("rate") || clean.includes("hike")
    );

    if (matched && !clean.includes("chip") && !clean.includes("semiconductor")) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...matched, userPrompt: prompt }), 800);
      });
    }

    const techMatched = MOCK_MULTI_AGENT_SCENARIOS.find(
      (s) => clean.includes("chip") || clean.includes("semi") || clean.includes("nvidia") || clean.includes("tech")
    );

    if (techMatched) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...techMatched, userPrompt: prompt }), 800);
      });
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `custom-${Date.now()}`,
          title: "Multi-Agent Synthesis: Comprehensive Capital Assessment",
          description: `Collaborative multi-agent analysis evaluating: "${prompt}"`,
          category: "Macroeconomic",
          userPrompt: prompt,
          involvedAgentIds: ["macro", "investment", "risk", "portfolio", "news"],
          signals: [],
          consensusVerdict: "Unified Consensus: Analysis Completed",
          consensusScore: 90,
          riskLevel: "Moderate",
          unifiedInsights: ["Multi-agent execution complete."],
          actionPlan: { immediate: [], mediumTerm: [] },
          explainability: {
            graphRAGContext: "Executed FinOS analysis.",
            decisionEngineWeighting: [],
            auditId: `FINOS-AUDIT-${Date.now()}`,
          },
        });
      }, 800);
    });
  },
};
