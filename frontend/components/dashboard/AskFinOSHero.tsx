"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
  TrendingUp,
  FileText,
  RotateCcw,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";
import { ALL_AGENTS } from "@/lib/mock/agents";

export function AskFinOSHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<
    "idle" | "routing" | "collaborating" | "synthesizing" | "completed"
  >("idle");
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<{
    query: string;
    agents: string[];
    consensusScore: number;
    verdict: string;
    findings: string[];
    actions: string[];
  } | null>(null);

  const suggestions = [
    { label: "Analyze my portfolio risk", query: "Analyze my portfolio risk and factor exposure." },
    { label: "Market outlook for next quarter", query: "What is the macroeconomic outlook for Indian and US equities next quarter?" },
    { label: "Tax saving suggestions", query: "Provide tax saving suggestions and harvestable loss opportunities." },
    { label: "Analyze my payslip", query: "Analyze my latest payslip for deductions and tax regime optimization." },
    { label: "Best investment opportunities", query: "Identify top risk-adjusted investment opportunities across large caps and sovereign debt." },
  ];

  const handleAnalyze = (customQuery?: string) => {
    const q = (customQuery || query).trim();
    if (!q) return;

    if (customQuery) {
      setQuery(customQuery);
    }

    // If query is specifically about payslip, allow quick jump or inline analysis
    if (q.toLowerCase().includes("payslip")) {
      router.push("/payslip");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage("routing");

    setTimeout(() => {
      setAnalysisStage("collaborating");
    }, 800);

    setTimeout(() => {
      setAnalysisStage("synthesizing");
    }, 1800);

    setTimeout(() => {
      setAnalysisStage("completed");
      setIsAnalyzing(false);

      // Generate dynamic context-aware response based on query keywords
      let agents = ["portfolio", "risk", "investment"];
      let verdict = "Optimized Asset Alignment (Low Drawdown Risk)";
      let findings = [
        "Portfolio beta stands at 0.88 with 95% 1-day Value-at-Risk under ₹1.42L (1.6% of NAV).",
        "Large-cap tech holdings (TCS, NVIDIA) exhibit resilient pricing power but warrant slight trimming into debt.",
        "Sovereign G-Sec yield curve steepening presents attractive duration extension opportunities.",
      ];
      let actions = [
        "Rebalance monthly cash inflows toward 10Y Indian Sovereign G-Sec (7.18% coupon).",
        "Set trailing stop-loss triggers on high-flying tech positions to lock in unrealized alpha.",
      ];

      if (q.toLowerCase().includes("tax")) {
        agents = ["tax", "portfolio", "credit"];
        verdict = "Tax Efficiency Optimization Available";
        findings = [
          "Identified ₹62,400 in net harvestable short-term losses to offset STCG liabilities.",
          "Section 115BAC New Tax Regime remains optimal given standard deduction of ₹75,000.",
        ];
        actions = [
          "Execute lot-by-lot harvesting before fiscal quarter-end.",
          "Check Section 94 compliance against wash-sale restrictions.",
        ];
      } else if (q.toLowerCase().includes("market") || q.toLowerCase().includes("outlook") || q.toLowerCase().includes("rbi")) {
        agents = ["macro", "news", "trading", "risk"];
        verdict = "Bullish Macro Stance with Inflation Moderation";
        findings = [
          "RBI projected to maintain 6.50% repo rate before initiating calibrated 25bps easing.",
          "Frontline banking Net Interest Margins (HDFC Bank, ICICI) show strong credit growth resilience.",
        ];
        actions = [
          "Accumulate high-quality private sector banking leaders on market dips.",
          "Hedge currency risk on foreign equity allocations.",
        ];
      }

      setActiveAnalysisResult({
        query: q,
        agents,
        consensusScore: 92,
        verdict,
        findings,
        actions,
      });
    }, 2800);
  };

  const handleReset = () => {
    setActiveAnalysisResult(null);
    setAnalysisStage("idle");
    setQuery("");
  };

  return (
    <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/5 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />

      {/* Hero Header */}
      <div className="max-w-2xl space-y-2 mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask FinOS Autonomous Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Ask FinOS anything about your finances
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Get insights from our AI agents powered by real data and analysis. Ask natural questions without worrying about which agent to pick.
        </p>
      </div>

      {/* Main Input Bar */}
      <div className="relative z-10 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition"
        >
          <div className="flex-1 flex items-center px-3 gap-2.5">
            <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Ask about your portfolio, market trends, taxes, or upload your payslip..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-2"
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400">Suggested:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAnalyze(s.query)}
              disabled={isAnalyzing}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-2xs transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live In-Progress Workflow State */}
      {isAnalyzing && (
        <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Multi-Agent Pipeline Active
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {analysisStage === "routing" && "1. Routing Query to Relevant Agents..."}
              {analysisStage === "collaborating" && "2. Concurrent Agent Reasoning & Data Fetch..."}
              {analysisStage === "synthesizing" && "3. Synthesizing Decision Engine Consensus..."}
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-slate-500">
            <div className={`p-2 rounded-lg border ${analysisStage === "routing" || analysisStage === "collaborating" || analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-800"}`}>
              1. Intent Routing
            </div>
            <div className={`p-2 rounded-lg border ${analysisStage === "collaborating" || analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-800"}`}>
              2. Agent Collaboration
            </div>
            <div className={`p-2 rounded-lg border ${analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-800"}`}>
              3. Conflict Resolution
            </div>
            <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              4. Unified Insight
            </div>
          </div>
        </div>
      )}

      {/* Completed Unified Insight Result Card */}
      {activeAnalysisResult && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                  Unified FinOS Consensus
                </span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                  {activeAnalysisResult.consensusScore}% Agreement Score
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {activeAnalysisResult.verdict}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Query: &ldquo;{activeAnalysisResult.query}&rdquo;
              </p>
            </div>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close analysis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Agents Consulted */}
          <div className="flex items-center gap-2 pt-1 pb-2 border-b border-emerald-500/20 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Agents Consulted:</span>
            <div className="flex flex-wrap gap-1.5">
              {activeAnalysisResult.agents.map((id) => {
                const ag = ALL_AGENTS.find((a) => a.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-slate-900 border border-emerald-500/30 text-slate-800 dark:text-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ag?.color.primary || "#10b981" }} />
                    <span>{ag?.name || id}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Key Findings */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Key Findings &amp; Telemetry
            </div>
            <div className="space-y-1.5">
              {activeAnalysisResult.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="pt-2 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Suggested Next Actions
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeAnalysisResult.actions.map((act, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20">
            <button
              onClick={() => router.push(`/ask?q=${encodeURIComponent(activeAnalysisResult.query)}`)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Continue Conversation in Ask FinOS Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => router.push("/reports")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Dossier</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
