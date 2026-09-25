import { Agent, AgentId, AgentMessage, AgentAnalysisResult, AgentHistoryItem } from "@/types/agent";
import { MOCK_AGENTS, MOCK_AGENT_MAP } from "@/lib/mock/agents";

export const agentsApi = {
  /**
   * Fetch all 10 specialized FinOS AI Agents.
   */
  async getAgents(): Promise<Agent[]> {
    // Allows backend endpoint swap: return apiClient<Agent[]>("/api/agents");
    return new Promise((resolve) => {
      setTimeout(() => resolve([...MOCK_AGENTS]), 100);
    });
  },

  /**
   * Fetch a single agent by ID or slug.
   */
  async getAgentById(idOrSlug: string): Promise<Agent | null> {
    const agent = MOCK_AGENTS.find(
      (a) => a.id === idOrSlug || a.slug === idOrSlug
    );
    return agent ? { ...agent } : null;
  },

  /**
   * Send a query or chat message to a specific agent.
   */
  async queryAgent(agentId: AgentId, message: string): Promise<AgentMessage> {
    const agent = MOCK_AGENT_MAP[agentId] || MOCK_AGENTS[0];
    
    // Simulate domain-aware agent response with structured data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `msg-${Date.now()}`,
          agentId,
          sender: "agent",
          content: `**${agent.name} Evaluation**: Analyzed your request regarding "${message}". Based on real-time market feeds and active risk guardrails, our quantitative models indicate healthy capital discipline with zero immediate concentration breaches.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "completed",
          analysisDetails: {
            toolsUsed: [
              `${agent.name} Factor Model`,
              "FinOS GraphRAG Traversal",
              "Vectorized SEC/NSE Filings",
            ],
            dataSources: agent.dataSources,
            reasoningSteps: [
              "Parsing entity relations and portfolio exposures",
              "Evaluating historical risk covariance matrices",
              "Checking regulatory compliance rules (Section 112A / SEBI limits)",
              "Reconciling cross-agent signals with Decision Engine",
            ],
            confidenceScore: parseFloat(agent.modelSpecs.confidenceThreshold) || 94.0,
          },
          result: {
            title: `${agent.name} — Actionable Findings`,
            summary: `Quantitative analysis completed across ${agent.dataSources.length} primary institutional feeds.`,
            keyFindings: [
              "Risk exposure remains within optimal standard deviation targets.",
              "Factor loading indicates positive exposure to high-quality balance sheets.",
              "Liquidity buffer is fully sufficient to handle simulated tail-events.",
            ],
            recommendations: [
              "Maintain current disciplined allocation parameters.",
              "Review upcoming macro calendar for unexpected central bank commentary.",
              "Consider triggering multi-agent pipeline for cross-validation.",
            ],
            riskLevel: "Low",
            confidenceScore: 94.2,
            metrics: [
              { label: "Confidence", value: "94.2%", isPositive: true },
              { label: "Latency", value: agent.modelSpecs.latency },
              { label: "Model Engine", value: agent.modelSpecs.engine },
            ],
            sources: agent.dataSources,
            explainabilityTrace: {
              decisionPath: `User Query -> ${agent.name} -> Knowledge Graph Subgraph -> Decision Engine Synthesis`,
              contributingFactors: [
                { factor: "Market Telemetry", weight: 0.45 },
                { factor: "Historical Factor Beta", weight: 0.35 },
                { factor: "Regulatory Guardrails", weight: 0.20 },
              ],
              guardrailsPassed: [
                "Max Sector Exposure < 35%",
                "Minimum Liquidity Buffer > 3%",
                "No Sanctioned Counterparty Dependencies",
              ],
            },
            collaboratingAgents: ["portfolio", "risk", "macro"].filter((id) => id !== agentId) as AgentId[],
          },
        });
      }, 750);
    });
  },

  /**
   * Fetch past execution and analysis history for an agent.
   */
  async getAgentHistory(agentId: AgentId): Promise<AgentHistoryItem[]> {
    return [
      {
        id: "hist-1",
        agentId,
        query: "Portfolio sensitivity under unexpected rate shift",
        timestamp: "Yesterday, 14:20 IST",
        status: "Completed",
        confidenceScore: 93.8,
        summary: "Validated duration insulation and confirmed stable net margins.",
      },
      {
        id: "hist-2",
        agentId,
        query: "Factor loading and single-stock concentration audit",
        timestamp: "Sep 22, 2026",
        status: "Action Taken",
        confidenceScore: 96.1,
        summary: "Set smart trailing stop guardrail at $122.00 on US holdings.",
      },
      {
        id: "hist-3",
        agentId,
        query: "Q3 liquidity and capital gains distribution check",
        timestamp: "Sep 18, 2026",
        status: "Completed",
        confidenceScore: 95.4,
        summary: "Identified eligible tax-loss harvesting lots to optimize year-end liability.",
      },
    ];
  },
};
