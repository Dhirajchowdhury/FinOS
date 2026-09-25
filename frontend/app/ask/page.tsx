"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";

import { AskFinOSComposer } from "@/components/ask-finos/AskFinOSComposer";
import { AgentSidebar, Thread } from "@/components/ask-finos/AgentSidebar";
import { AgentSelectorGrid } from "@/components/ask-finos/AgentSelectorGrid";
import { AgentDetailModal } from "@/components/ask-finos/AgentDetailModal";
import { AgentWorkspacePanel } from "@/components/ask-finos/AgentWorkspacePanel";
import { FinOSResponseBubble, ConversationMessage } from "@/components/ask-finos/FinOSResponseBubble";
import { ThinkingState } from "@/components/ask-finos/ThinkingState";
import { SuggestedPromptsHero } from "@/components/ask-finos/SuggestedPromptsHero";

import {
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  ShieldCheck,
  Search,
  Layers,
  ChevronRight,
} from "lucide-react";

interface FullThread extends Thread {
  messages: ConversationMessage[];
}

type ViewState = "initial" | "searched" | "agent";

function AskFinOSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  // View State for Search-First Workspace: "initial" | "searched" | "agent"
  const [viewState, setViewState] = useState<ViewState>(initialQuery ? "searched" : "initial");
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialQuery);

  // Initial Threads State
  const [threads, setThreads] = useState<FullThread[]>([
    {
      id: "t-1",
      title: "Technology Overweight Risk",
      time: "Today, 14:20",
      messages: [
        {
          id: "m-1",
          sender: "user",
          text: "Should I be concerned about my technology exposure?",
          timestamp: "14:20",
        },
        {
          id: "m-2",
          sender: "finos",
          text: "Based on your verified portfolio positions, your technology allocation is 31.6% (TCS and NVIDIA), which is +6.2% above your target risk budget. However, robust free cash flow yields mitigate near-term downside.",
          timestamp: "14:21",
          agentsConsulted: ["portfolio", "risk", "investment", "macro"],
          consensusScore: 91,
          findings: [
            "TCS and NVIDIA combine for ₹27.98L (31.6% of NAV).",
            "Factor beta on tech sleeve is 1.14 vs broader portfolio beta of 0.88.",
            "Semiconductor capital expenditure commitments by US hyperscalers remain strong above $200B.",
          ],
          actions: [
            "Rebalance upcoming monthly surplus into Sovereign Debt (G-Sec 2034) to normalize tech weight to 25%.",
            "Set trailing stop-loss guardrails around ₹4,050 for TCS to protect short-term gains.",
          ],
          sources: ["Bloomberg B-PIPE", "SEC EDGAR 10-K", "FinOS Risk Engine"],
        },
      ],
    },
    {
      id: "t-2",
      title: "RBI Repo Rate Sensitivity",
      time: "Yesterday",
      messages: [
        {
          id: "m-3",
          sender: "user",
          text: "How will an RBI rate hike or pause affect my banking holdings?",
          timestamp: "Yesterday",
        },
        {
          id: "m-4",
          sender: "finos",
          text: "The Macro and News agents confirm an 88% probability of steady rates at 6.50%. HDFC Bank exhibits positive Net Interest Margin stability under current liquidity parameters.",
          timestamp: "Yesterday",
          agentsConsulted: ["macro", "news", "risk", "portfolio"],
          consensusScore: 88,
          findings: [
            "Core CPI cooling to 3.8% provides headroom against rate hikes.",
            "HDFC Bank loan book expansion pace stands at 14.8% YoY.",
          ],
          actions: ["Maintain current banking allocation without tactical trimming."],
          sources: ["RBI Database", "Reuters Wire", "FinOS Macro-LSTM"],
        },
      ],
    },
    {
      id: "t-3",
      title: "Q4 Tax-Loss Harvesting",
      time: "Sep 22",
      messages: [
        {
          id: "m-5",
          sender: "user",
          text: "Are there any tax loss harvesting opportunities before the quarter ends?",
          timestamp: "Sep 22",
        },
        {
          id: "m-6",
          sender: "finos",
          text: "Tax Agent identified ₹62,400 in net harvestable short-term losses across secondary equities, eligible to offset STCG liabilities under Section 112A.",
          timestamp: "Sep 22",
          agentsConsulted: ["tax", "portfolio"],
          consensusScore: 95,
          findings: [
            "Eligible capital loss lots identified in volatile mid-cap positions.",
            "Section 94 compliance verified against wash-sale restrictions.",
          ],
          actions: ["Execute selective lot liquidation before quarter-end."],
          sources: ["Income Tax Dept Circulars", "Internal Brokerage Tax Lots"],
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState("t-1");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [inspectModalAgent, setInspectModalAgent] = useState<Agent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [composerInitialText, setComposerInitialText] = useState(initialQuery);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Auto scroll message stream to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentThread?.messages, isProcessing]);

  // Handle agent selection from sidebar or grid
  const handleSelectAgent = (agent: Agent | null) => {
    setSelectedAgent(agent);
    if (agent) {
      setViewState("agent");
    } else {
      setViewState(currentThread.messages.length > 0 ? "searched" : "initial");
    }
  };

  const handleNewThread = () => {
    const newId = `t-${Date.now()}`;
    const newThread: FullThread = {
      id: newId,
      title: "New Financial Inquiry",
      time: "Just now",
      messages: [],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
    setSelectedAgent(null);
    setViewState("initial");
    setActiveSearchQuery("");
  };

  // Main message send handler
  const handleSendMessage = ({
    message,
    deepReasoning,
    attachments,
    selectedAgentId,
  }: {
    message: string;
    deepReasoning: boolean;
    attachments: Array<{ name: string; type: string }>;
    selectedAgentId?: AgentId | null;
  }) => {
    if (!message.trim() || isProcessing) return;

    setActiveSearchQuery(message);
    if (viewState === "initial") {
      setViewState("searched");
    }

    const userMsg: ConversationMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: attachments.length > 0
        ? `${message} [Attached: ${attachments.map((a) => a.name).join(", ")}]`
        : message,
      timestamp: "Just now",
    };

    const updatedMessages = [...currentThread.messages, userMsg];

    // Update title if first message
    const threadTitle = currentThread.messages.length === 0
      ? message.length > 28 ? `${message.substring(0, 28)}...` : message
      : currentThread.title;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, title: threadTitle, messages: updatedMessages }
          : t
      )
    );

    setIsProcessing(true);

    // Intelligent Agent Routing Logic
    setTimeout(() => {
      const lowerQuery = message.toLowerCase();
      let consulted: AgentId[] = ["portfolio", "risk", "investment", "macro"];
      let consensus = 92;
      let responseSummary = "";
      let findingsList: string[] = [];
      let actionsList: string[] = [];
      let sourcesList: string[] = [];

      // Detect @Mention or selected agent prioritization
      if (selectedAgentId) {
        consulted = [selectedAgentId, "portfolio", "risk"];
      } else if (lowerQuery.includes("@tax") || lowerQuery.includes("tax")) {
        consulted = ["tax", "portfolio", "report"];
        consensus = 95;
        responseSummary = `Tax Agent scanned open positions under Section 112A & 94. Short-term harvesting opportunities estimated at ₹48,500.`;
        findingsList = [
          "Identified 3 loss lots in non-core holdings eligible for immediate harvesting.",
          "Verified wash-sale compliance for next 30 days.",
        ];
        actionsList = ["Liquidate loss lots before fiscal quarter close to optimize net capital gain liability."];
        sourcesList = ["CBDT Tax Rule Engine v4.2", "Internal Tax Lot Ledger"];
      } else if (lowerQuery.includes("@news") || lowerQuery.includes("news") || lowerQuery.includes("market")) {
        consulted = ["news", "macro", "risk", "investment"];
        consensus = 94;
        responseSummary = `News Agent parsed global media wires & regulatory feeds. Sentiment index stands at +0.42 (Moderately Bullish).`;
        findingsList = [
          "Macro headline sentiment remains supported by cooling headline inflation.",
          "No adverse SEBI/SEC regulatory disclosures recorded in the last 24 hours.",
        ];
        actionsList = ["Maintain tactical equity tilt with focus on resilient cash flow names."];
        sourcesList = ["Reuters Wire", "Financial Times API", "SEBI Disclosures"];
      } else if (lowerQuery.includes("@credit") || lowerQuery.includes("credit") || lowerQuery.includes("debt")) {
        consulted = ["credit", "macro", "risk"];
        consensus = 91;
        responseSummary = `Credit Agent calculated synthetic corporate ratings and debt coverage metrics. DSCR remains healthy at 2.45x.`;
        findingsList = [
          "Corporate bond yield spreads between AAA and AA papers narrowed by 12bps.",
          "Debt covenant buffers remain compliant across all credit facilities.",
        ];
        actionsList = ["Monitor rate refinancing schedules ahead of upcoming central bank policy decisions."];
        sourcesList = ["CRISIL Data Feeds", "Internal Balance Sheet Engine"];
      } else if (lowerQuery.includes("@fraud") || lowerQuery.includes("fraud") || lowerQuery.includes("suspicious")) {
        consulted = ["fraud", "risk", "credit"];
        consensus = 99;
        responseSummary = `Fraud Agent executed GNN transaction anomaly scan across recent disbursements. 0 critical security alerts found.`;
        findingsList = [
          "All wire disbursements verified against sanctioned OFAC entity lists.",
          "Geolocation and session signatures confirmed zero multi-IP anomalies.",
        ];
        actionsList = ["Keep automated GraphRAG transaction guardrails active."];
        sourcesList = ["FinOS Security Enclave", "OFAC Sanctions Registry"];
      } else if (lowerQuery.includes("@trading") || lowerQuery.includes("trading") || lowerQuery.includes("slippage")) {
        consulted = ["trading", "risk", "portfolio"];
        consensus = 93;
        responseSummary = `Trading Agent evaluated order book microstructures and bid-ask spreads. Estimated market impact for block rebalance is 8bps.`;
        findingsList = [
          "Level 2 order book liquidity depth is optimal for VWAP algorithmic execution.",
          "Slippage probability on high-beta equity sleeve is within acceptable parameters.",
        ];
        actionsList = ["Execute block orders using TWAP slicing over 45-minute window."];
        sourcesList = ["NSE Level 3 Feeds", "FinOS Microstructure Engine"];
      } else if (lowerQuery.includes("@report") || lowerQuery.includes("report") || lowerQuery.includes("memo")) {
        consulted = ["report", "portfolio", "investment"];
        consensus = 96;
        responseSummary = `Report Agent generated executive memo synthesizing multi-agent findings for institutional stakeholders.`;
        findingsList = [
          "Multi-asset attribution confirmed 68% return driven by asset selection.",
          "Risk-adjusted Sharpe Ratio calculated at 1.84 YTD.",
        ];
        actionsList = ["Click 'Generate Formal Institutional Report' below to export audit-ready PDF."];
        sourcesList = ["LaTeX Document Core", "FinOS Consolidated State"];
      } else {
        responseSummary = `FinOS multi-agent engine synthesized real-time telemetry regarding "${message}". Portfolio risk guardrails and liquidity indexes confirm a balanced posture.`;
        findingsList = [
          `Cross-agent reconciliation completed with ${deepReasoning ? "97%" : "92%"} confidence score.`,
          "Portfolio factor loadings and liquidity guardrails remain within target bounds.",
          "Sovereign yield curve and macro telemetry cross-verified with official exchange feeds.",
        ];
        actionsList = [
          "Review detailed allocation in the Portfolio workspace.",
          "Generate an executive dossier to document mathematical attribution.",
        ];
        sourcesList = ["Bloomberg B-PIPE", "Refinitiv Eikon", "FinOS GNN Core"];
      }

      const finosMsg: ConversationMessage = {
        id: `f-${Date.now()}`,
        sender: "finos",
        text: responseSummary,
        timestamp: "Just now",
        agentsConsulted: consulted,
        consensusScore: consensus,
        findings: findingsList,
        actions: actionsList,
        sources: sourcesList,
        deepReasoning,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...updatedMessages, finosMsg] }
            : t
        )
      );

      setIsProcessing(false);
    }, 1900);
  };

  const handleOpenAgentWorkspace = (agentId: AgentId) => {
    const ag = ALL_AGENTS.find((a) => a.id === agentId);
    if (ag) {
      setSelectedAgent(ag);
      setViewState("agent");
    }
  };

  const handleStartAgentChat = (agent: Agent, query?: string) => {
    setSelectedAgent(agent);
    setViewState("agent");
    if (query) {
      handleSendMessage({
        message: query,
        deepReasoning: false,
        attachments: [],
        selectedAgentId: agent.id,
      });
    }
  };

  const hasMessages = currentThread.messages.length > 0;

  return (
    <AppShell
      headerTitle="Ask FinOS Workspace"
      headerSubtitle="Search-First Multi-Agent Financial Intelligence Command Center"
    >
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[650px]">
        {/* Left Sidebar: Inquiry Threads & FinOS 10 Agents Navigation */}
        <AgentSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
            setActiveThreadId(id);
            const target = threads.find((t) => t.id === id);
            if (target && target.messages.length > 0) {
              setViewState("searched");
            } else if (!selectedAgent) {
              setViewState("initial");
            }
          }}
          onNewThread={handleNewThread}
          selectedAgentId={selectedAgent?.id || null}
          onSelectAgent={handleSelectAgent}
        />

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0 bg-white dark:bg-[#0c1222] relative overflow-hidden">
          {/* Workspace Header Top Bar */}
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-4 shrink-0 z-10 transition-all duration-300">
            {/* Left: View State Badge / Back Button */}
            {viewState === "agent" && selectedAgent ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewState("searched")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← All Agents</span>
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedAgent.accentColor }}
                  />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {selectedAgent.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ● Workspace Active
                  </span>
                </div>
              </div>
            ) : viewState === "searched" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewState("initial");
                    setSelectedAgent(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </button>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Ask FinOS Multi-Agent Command Center
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-500">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                  FinOS Autonomous AI Engine
                </span>
              </div>
            )}

            {/* Right Top Area: Compact Docked Search Bar (Positioned at EXTREME RIGHT SIDE) */}
            {viewState !== "initial" && (
              <div className="ml-auto w-full max-w-[420px] shrink-0 animate-in fade-in duration-300">
                <AskFinOSComposer
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                  selectedAgent={selectedAgent}
                  compact={true}
                  placeholder={
                    activeSearchQuery
                      ? `Query: "${activeSearchQuery.length > 20 ? activeSearchQuery.substring(0, 20) + "..." : activeSearchQuery}" — Search again...`
                      : "Search finances, markets, risk..."
                  }
                  initialText={composerInitialText}
                />
              </div>
            )}
          </div>

          {/* Main Content Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* 1. INITIAL STATE: Dominant Centered Search Bar */}
            {viewState === "initial" && (
              <div className="flex flex-col items-center justify-center min-h-[500px] py-6 sm:py-12 px-2 text-center animate-in fade-in zoom-in-95 duration-500">
                {/* Brand Hero Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>FinOS Multi-Agent Financial Operating System</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white max-w-3xl leading-tight">
                  Ask anything about your finances
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 mb-8 max-w-xl leading-relaxed">
                  Ask anything about your finances, markets, portfolio, risk, taxes or investments.
                </p>

                {/* Dominant Centered Composer Box */}
                <div className="w-full max-w-3xl mx-auto transform transition-all duration-300 hover:scale-[1.005]">
                  <AskFinOSComposer
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                    selectedAgent={selectedAgent}
                    placeholder="Ask anything about your portfolio, risk, market trends, taxes..."
                    initialText={composerInitialText}
                  />
                </div>

                {/* Suggested Prompt Hero Cards below */}
                <div className="mt-10 w-full">
                  <SuggestedPromptsHero
                    onSelectPrompt={(promptText) =>
                      handleSendMessage({
                        message: promptText,
                        deepReasoning: false,
                        attachments: [],
                        selectedAgentId: selectedAgent?.id,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* 2. SEARCHED STATE: Revealing 10 Agent Cards & Multi-Agent Response Stream */}
            {viewState === "searched" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* 10 Agent Interactive Cards Grid */}
                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                  <AgentSelectorGrid
                    onSelectAgent={handleSelectAgent}
                    activeAgentId={selectedAgent?.id}
                    searchQuery={activeSearchQuery}
                  />
                </div>

                {/* Active Conversation Response Stream */}
                {hasMessages && (
                  <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2 px-1">
                      <Bot className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Multi-Agent Synthesized Response
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {currentThread.messages.map((msg) => (
                        <FinOSResponseBubble
                          key={msg.id}
                          message={msg}
                          onOpenAgent={handleOpenAgentWorkspace}
                        />
                      ))}

                      {isProcessing && <ThinkingState />}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. SAME-PAGE AGENT WORKSPACE: Selected Agent View */}
            {viewState === "agent" && selectedAgent && (
              <AgentWorkspacePanel
                agent={selectedAgent}
                onBack={() => setViewState("searched")}
                onInvolveAgents={(suggestedQuery) => {
                  handleSendMessage({
                    message: suggestedQuery,
                    deepReasoning: true,
                    attachments: [],
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Agent Detail Modal Drawer when inspecting an agent directly */}
      <AgentDetailModal
        agent={inspectModalAgent}
        onClose={() => setInspectModalAgent(null)}
        onStartAgentChat={handleStartAgentChat}
      />
    </AppShell>
  );
}

export default function AskFinOSPage() {
  return (
    <Suspense
      fallback={
        <AppShell headerTitle="Ask FinOS Workspace">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">
                Loading Search-First Multi-Agent Workspace...
              </span>
            </div>
          </div>
        </AppShell>
      }
    >
      <AskFinOSContent />
    </Suspense>
  );
}

