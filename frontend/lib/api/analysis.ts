import { apiClient } from "./client";
import { MultiAgentScenario } from "@/types/analysis";
import { MOCK_MULTI_AGENT_SCENARIOS } from "@/lib/mock/analysis";
import { ConversationMessage } from "@/components/ask-finos/FinOSResponseBubble";

export interface RealAnalysisRequest {
  entity_id?: string;
  request: string;
  market?: string;
  as_of_date?: string;
  window_days?: number;
  context?: Record<string, any>;
}

export interface EvidenceRef {
  evidence_id: string;
  source: string;
  title: string;
  url?: string | null;
  publisher?: string | null;
  published_at?: string | null;
  retrieved_at?: string | null;
  relevance?: string | null;
  relevance_reason?: string | null;
  matched_entity?: string | null;
  included_in_sentiment?: boolean | null;
  source_feed?: string | null;
}

export interface SentimentRead {
  band: string;
  score: number | null;
  confidence: "low" | "medium" | "high";
  rationale: string;
  evidence_ids: string[];
  source: "llm" | "deterministic" | "none";
  method?: string | null;
  positive_signals?: number | null;
  negative_signals?: number | null;
  article_count?: number | null;
  total_retrieved?: number | null;
}

export interface EventClaim {
  event_id: string;
  event_type: string;
  summary: string;
  entities: string[];
  sectors: string[];
  macro_factors: string[];
  published_at?: string | null;
  evidence_ids: string[];
  confidence: string;
  uncertainty: string;
  relevance?: string | null;
  relevance_reason?: string | null;
  matched_entity?: string | null;
}

export interface RelevanceSummary {
  total_retrieved: number;
  company_specific: number;
  sector_relevant: number;
  macro_context: number;
  irrelevant: number;
  included_in_sentiment: number;
}

export interface TransmissionPath {
  pathway_id: string;
  source_factor: string;
  target: { entity_id: string; kind: string; confidence: string };
  direction: string;
  mechanism: string;
  horizon: string;
  supporting_evidence_ids: string[];
  counterevidence_ids: string[];
  confidence: string;
  uncertainty: string;
  is_verified: boolean;
}

export interface SourceQuality {
  vendor: string;
  retrieved_at?: string | null;
  freshness: string;
  status: string;
}

export interface DataQuality {
  sources: SourceQuality[];
  missing_inputs: string[];
  notes: string[];
}

export interface UnavailableEvidence {
  capability: string;
  status: string;
  reason: string;
}

export interface SentimentImpactReport {
  observed_facts: EvidenceRef[];
  sentiment: SentimentRead;
  events: EventClaim[];
  impact_hypotheses: TransmissionPath[];
  relevance_summary?: RelevanceSummary | null;
  data_quality: DataQuality;
  unavailable_evidence: UnavailableEvidence[];
  validation?: Record<string, any> | null;
  causal?: Record<string, any> | null;
}

export interface ReportRequestInfo {
  entity_id: string;
  entity_type?: string | null;
  market?: string | null;
  as_of_date?: string | null;
  window_days: number;
}

/**
 * Versioned response contract returned by POST /analysis.
 */
export interface SentimentImpactState {
  contract_version: string;
  id?: string;
  analysis_id?: string;
  request: ReportRequestInfo;
  data_status: string;
  report: SentimentImpactReport;
  errors: string[];
}

function _scoreLabel(score: number | null | undefined): string {
  return score === null || score === undefined ? "n/a" : `${score}/10`;
}

/**
 * Adapter converting the sentiment & market-impact response into the
 * ConversationMessage shape rendered by the UI. It does not fabricate metrics:
 * every finding derives from the returned report, and unavailable capabilities
 * are surfaced explicitly.
 */
export function adapterFinosStateToConversationMessage(
  state: SentimentImpactState,
  deepReasoning: boolean = false
): ConversationMessage {
  const report = state.report;
  const sentiment = report?.sentiment;
  const entity = state.request?.entity_id || report?.observed_facts?.[0]?.title || "the requested entity";

  let mainText: string;
  if (!sentiment || state.data_status === "UNAVAILABLE") {
    mainText =
      `No usable news evidence was available for ${entity}, so no defensible ` +
      `sentiment conclusion can be drawn. See the data-quality section for the reason.`;
  } else {
    mainText =
      `Overall sentiment for ${entity} is ${String(sentiment.band).replace(/_/g, " ")} ` +
      `(score ${_scoreLabel(sentiment.score)}, confidence: ${sentiment.confidence}). ` +
      `${sentiment.rationale || ""}`.trim();
  }

  const findings: string[] = [];
  if (sentiment) {
    findings.push(
      `SENTIMENT | Band: ${String(sentiment.band).toUpperCase()} | Score: ${_scoreLabel(sentiment.score)} | ` +
        `Confidence: ${sentiment.confidence} | Source: ${sentiment.source}`
    );
  }
  findings.push(`DATA STATUS | ${state.data_status}`);

  const facts = report?.observed_facts || [];
  if (facts.length > 0) {
    const vendors = Array.from(new Set(facts.map((f) => f.source))).join(", ");
    findings.push(`OBSERVED FACTS | ${facts.length} article(s) | Sources: ${vendors}`);
  }

  const relevance = report?.relevance_summary;
  if (relevance) {
    findings.push(
      `RELEVANCE | company-specific: ${relevance.company_specific} | sector: ${relevance.sector_relevant} | ` +
        `macro: ${relevance.macro_context} | irrelevant: ${relevance.irrelevant} | total: ${relevance.total_retrieved}`
    );
  }

  const events = report?.events || [];
  for (const event of events.slice(0, 5)) {
    findings.push(
      `EVENT: ${String(event.event_type).toUpperCase()} | ${event.summary} | ` +
        `confidence: ${event.confidence}`
    );
  }

  const paths = report?.impact_hypotheses || [];
  for (const path of paths.slice(0, 5)) {
    findings.push(
      `IMPACT HYPOTHESIS | ${path.source_factor} → ${path.target?.entity_id || entity} | ` +
        `${path.direction} | horizon: ${path.horizon}`
    );
  }

  for (const unavailable of report?.unavailable_evidence || []) {
    findings.push(`UNAVAILABLE: ${unavailable.capability} | ${unavailable.reason}`);
  }

  const actions: string[] = [];
  for (const path of paths.slice(0, 3)) {
    if (path.mechanism) {
      actions.push(`Monitor ${path.source_factor} → ${path.target?.entity_id || entity}: ${path.mechanism}`);
    }
  }
  if (state.data_status !== "AVAILABLE") {
    actions.push("Treat these results as provisional; some evidence was unavailable.");
  }

  const sourcesSet = new Set<string>();
  for (const source of report?.data_quality?.sources || []) {
    if (source.vendor) sourcesSet.add(source.vendor);
  }
  sourcesSet.add("FinOS Sentiment Engine");
  if (sentiment?.source === "llm") sourcesSet.add("LLM enrichment");
  const sources = Array.from(sourcesSet);

  return {
    id: `finos-${Date.now()}`,
    sender: "finos",
    text: mainText,
    timestamp: "Just now",
    findings: findings.length > 0 ? findings : undefined,
    actions: actions.length > 0 ? actions : undefined,
    sources: sources.length > 0 ? sources : undefined,
    deepReasoning,
    analysisId: state.id || state.analysis_id,
    entity_id: state.request?.entity_id,
  };
}

export const analysisApi = {
  /**
   * Execute the sentiment & market-impact analysis via the FastAPI backend.
   */
  async runAnalysis(payload: RealAnalysisRequest): Promise<SentimentImpactState> {
    return apiClient<SentimentImpactState>("/analysis", {
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
