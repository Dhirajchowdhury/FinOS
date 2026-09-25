"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X, Send, Bot, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { MOCK_AGENTS } from "@/lib/mock/agents";
import { AgentId } from "@/types/agent";

interface FinOSAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinOSAssistant({ isOpen, onClose }: FinOSAssistantProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [identifiedAgents, setIdentifiedAgents] = useState<AgentId[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsOrchestrating(true);
    setIdentifiedAgents([]);
    setSummary(null);

    // Simulate smart agent orchestration
    setTimeout(() => {
      const clean = prompt.toLowerCase();
      let selected: AgentId[] = ["portfolio", "risk", "investment"];

      if (clean.includes("rate") || clean.includes("rbi") || clean.includes("fed") || clean.includes("macro") || clean.includes("inflation")) {
        selected = ["macro", "news", "risk", "portfolio", "investment"];
      } else if (clean.includes("chip") || clean.includes("semi") || clean.includes("nvidia") || clean.includes("tech")) {
        selected = ["investment", "risk", "news", "trading", "portfolio"];
      } else if (clean.includes("tax") || clean.includes("loss") || clean.includes("harvest")) {
        selected = ["tax", "portfolio", "investment"];
      } else if (clean.includes("fraud") || clean.includes("wire") || clean.includes("transfer") || clean.includes("anomaly")) {
        selected = ["fraud", "trading", "risk"];
      } else if (clean.includes("credit") || clean.includes("debt") || clean.includes("loan")) {
        selected = ["credit", "macro", "risk"];
      }

      setIdentifiedAgents(selected);
      setSummary(
        `FinOS Decision Engine evaluated your prompt and determined that a unified cross-agent analysis across ${selected.length} specialized agents is required to achieve explainable consensus.`
      );
      setIsOrchestrating(false);
    }, 600);
  };

  const handleLaunchMultiAgent = () => {
    onClose();
    router.push(`/analysis/multi-agent?q=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">FinOS Global Assistant</h2>
              <p className="text-[10px] text-slate-500 font-mono">Multi-Agent Orchestrator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ask any financial question in natural language. The FinOS Decision Engine will orchestrate the appropriate specialized AI agents to deliver explainable, unified insights.
          </div>

          {/* Quick suggestions */}
          {!summary && !isOrchestrating && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Suggested Financial Prompts
              </span>
              <div className="space-y-1.5">
                {[
                  "Analyze the impact of an RBI rate hike on my portfolio.",
                  "Assess the risk of US-China chip export restrictions on my tech positions.",
                  "Identify tax-loss harvesting candidates before quarter-end.",
                  "Reconcile daily NAV against the NIFTY and S&P 500 benchmarks.",
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(s);
                    }}
                    className="w-full text-left text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orchestrating state */}
          {isOrchestrating && (
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center space-y-2">
              <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Orchestrating agent collaboration...
              </p>
              <p className="text-[11px] text-slate-500">
                Resolving entities via GraphRAG and querying factor models
              </p>
            </div>
          )}

          {/* Orchestration Results */}
          {summary && identifiedAgents.length > 0 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Agent Team Assembled</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {summary}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Activated Agents ({identifiedAgents.length})
                </span>
                <div className="space-y-1.5">
                  {identifiedAgents.map((agentId) => {
                    const agent = MOCK_AGENTS.find((a) => a.id === agentId);
                    if (!agent) return null;
                    return (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text}`}>
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {agent.category}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                          Active
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleLaunchMultiAgent}
                className="w-full bg-[#047857] hover:bg-[#065f46] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition cursor-pointer"
              >
                <span>Launch Multi-Agent Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Composer Input Footer */}
        <form onSubmit={handleAsk} className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask FinOS (e.g. rate hike impact)..."
              disabled={isOrchestrating}
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isOrchestrating || !prompt.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center justify-center transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
