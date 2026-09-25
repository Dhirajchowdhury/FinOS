"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ALL_AGENTS } from "@/lib/mock/agents";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  FileText,
  Loader2,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface ConversationMessage {
  id: string;
  sender: "user" | "finos";
  text: string;
  timestamp: string;
  agentsConsulted?: string[];
  consensusScore?: number;
  findings?: string[];
  actions?: string[];
}

interface Thread {
  id: string;
  title: string;
  time: string;
  messages: ConversationMessage[];
}

function AskFinOSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [threads, setThreads] = useState<Thread[]>([
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
          actions: [
            "Maintain current banking allocation without tactical trimming.",
          ],
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
          actions: [
            "Execute selective lot liquidation before quarter-end.",
          ],
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState("t-1");
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedFindingsId, setExpandedFindingsId] = useState<string | null>("m-2");

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // If query is passed in URL query param, automatically send or populate
  useEffect(() => {
    if (initialQuery) {
      setInputText(initialQuery);
    }
  }, [initialQuery]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isThinking) return;

    const userMsg: ConversationMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    const updatedMessages = [...currentThread.messages, userMsg];
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThreadId ? { ...t, messages: updatedMessages } : t))
    );
    setInputText("");
    setIsThinking(true);

    setTimeout(() => {
      const finosMsg: ConversationMessage = {
        id: `f-${Date.now()}`,
        sender: "finos",
        text: `Based on real-time telemetry across our 10 agents, your query on "${text}" has been reconciled against sovereign filings and multi-asset position tables.`,
        timestamp: "Just now",
        agentsConsulted: ["macro", "risk", "investment", "portfolio"],
        consensusScore: 92,
        findings: [
          "Cross-agent reconciliation completed with 92% weighted confidence.",
          "Market liquidity indicators and risk guardrails confirm stable risk posture.",
          "Citations cross-verified with official exchange feeds and treasury data.",
        ],
        actions: [
          "Review updated allocation in the Portfolio workspace.",
          "Generate an institutional dossier to export full mathematical attribution.",
        ],
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...updatedMessages, finosMsg] }
            : t
        )
      );
      setExpandedFindingsId(finosMsg.id);
      setIsThinking(false);
    }, 1800);
  };

  const handleNewThread = () => {
    const newId = `t-${Date.now()}`;
    const newThread: Thread = {
      id: newId,
      title: "New Financial Inquiry",
      time: "Just now",
      messages: [
        {
          id: `m-init-${Date.now()}`,
          sender: "finos",
          text: "Hello, I am FinOS. Ask any question regarding your portfolio, market shifts, tax liabilities, or upload your payslip for automated analysis.",
          timestamp: "Just now",
          agentsConsulted: ["portfolio", "macro", "risk"],
        },
      ],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
  };

  return (
    <AppShell headerTitle="Ask FinOS Workspace" headerSubtitle="Natural-language multi-agent financial reasoning">
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[550px]">
        {/* Left Column: Conversation History (260px) */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#090e1a] flex flex-col justify-between shrink-0">
          <div>
            <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inquiry Threads
              </span>
              <button
                onClick={handleNewThread}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
              {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-2.5 ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700 font-semibold"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.time}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Audit-indexed GraphRAG</span>
          </div>
        </div>

        {/* Right Column: Chat Stream & Message Input */}
        <div className="flex-1 flex flex-col justify-between h-full bg-white dark:bg-[#0c1222]">
          {/* Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
            {currentThread.messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isFindingsExpanded = expandedFindingsId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                        : "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`space-y-2 max-w-2xl ${isUser ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-xs"
                          : "bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white rounded-tl-xs shadow-2xs"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Agent metadata & findings accordion for FinOS responses */}
                    {!isUser && msg.agentsConsulted && (
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              Agents Consulted:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.agentsConsulted.map((aId) => {
                                const ag = ALL_AGENTS.find((a) => a.id === aId);
                                return (
                                  <span
                                    key={aId}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                  >
                                    {ag?.name || aId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {msg.consensusScore && (
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {msg.consensusScore}% Consensus
                            </span>
                          )}
                        </div>

                        {/* Collapsible Findings */}
                        {msg.findings && msg.findings.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <button
                              onClick={() =>
                                setExpandedFindingsId(isFindingsExpanded ? null : msg.id)
                              }
                              className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition"
                            >
                              <span>Key Findings &amp; Observations ({msg.findings.length})</span>
                              {isFindingsExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {isFindingsExpanded && (
                              <div className="space-y-1.5 mt-2 animate-in fade-in">
                                {msg.findings.map((f, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{f}</span>
                                  </div>
                                ))}

                                {msg.actions && (
                                  <div className="pt-2 space-y-1">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                      Recommended Actions:
                                    </span>
                                    {msg.actions.map((act, idx) => (
                                      <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-800 dark:text-slate-200">
                                        <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{act}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pt-2 text-right">
                                  <button
                                    onClick={() => router.push("/reports")}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>Generate Formal Report</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                  <span>Synthesizing multi-agent consensus...</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Message Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0a0f1c]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/30 transition"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isThinking}
                placeholder="Ask about your portfolio, market events, or specific assets..."
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition shadow-2xs shrink-0 cursor-pointer"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function AskFinOSPage() {
  return (
    <Suspense
      fallback={
        <AppShell headerTitle="Ask FinOS">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Loading Ask FinOS Workspace...</span>
            </div>
          </div>
        </AppShell>
      }
    >
      <AskFinOSContent />
    </Suspense>
  );
}
