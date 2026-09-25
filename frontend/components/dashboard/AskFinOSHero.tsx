"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { MagneticButton } from "@/components/motion/MagneticButton";
import {
  fadeUp,
  scaleIn,
  buttonPressVariants,
  cardHoverVariants,
} from "@/lib/motion";

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
    <div className="bg-[#f0fbf5] dark:bg-[#071912] border border-[#a7f3d0] dark:border-[#065f46]/50 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/10 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />

      {/* Hero Header with Top-Right Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 relative z-10">
        <div className="max-w-2xl space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>FinOS Autonomous Intelligence</span>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Ask <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">FinOS</span> anything about your finances
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Get insights from our AI agents powered by real data and analysis
          </p>
        </div>

        {/* System Status Indicator */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800 shadow-2xs backdrop-blur-xs shrink-0 self-start cursor-default"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            All Systems Operational
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            10/10 Agents Online
          </span>
        </motion.div>
      </div>

      {/* Main Input Bar */}
      <div className="relative z-10 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex items-center gap-2 p-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-xs focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all duration-200"
        >
          <div className="flex-1 flex items-center px-3.5 gap-2.5">
            <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Ask about your portfolio, market trends, taxes, or upload your payslip..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none py-2 font-medium"
            />
          </div>

          <MagneticButton
            type="submit"
            disabled={!query.trim() || isAnalyzing}
            strength={3}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            title="Ask FinOS"
            aria-label="Submit Question"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </MagneticButton>
        </form>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Suggested:</span>
          {suggestions.map((s, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleAnalyze(s.query)}
              disabled={isAnalyzing}
              className="px-3 py-1.5 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs transition-colors cursor-pointer font-medium"
            >
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Live In-Progress Multi-Agent Pipeline */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Multi-Agent Pipeline Active
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {analysisStage === "routing" && "1. Routing Query to Relevant Agents..."}
                {analysisStage === "collaborating" && "2. Concurrent Agent Reasoning & Data Fetch..."}
                {analysisStage === "synthesizing" && "3. Synthesizing Decision Engine Consensus..."}
              </span>
            </div>

            {/* Stepper Bar */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-slate-500">
              <div className={`p-2 rounded-lg border transition-all duration-300 ${analysisStage === "routing" || analysisStage === "collaborating" || analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs" : "border-slate-200 dark:border-slate-800"}`}>
                1. Intent Routing
              </div>
              <div className={`p-2 rounded-lg border transition-all duration-300 ${analysisStage === "collaborating" || analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs" : "border-slate-200 dark:border-slate-800"}`}>
                2. Agent Collaboration
              </div>
              <div className={`p-2 rounded-lg border transition-all duration-300 ${analysisStage === "synthesizing" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-2xs" : "border-slate-200 dark:border-slate-800"}`}>
                3. Conflict Resolution
              </div>
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                4. Unified Insight
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed Unified Insight Result Card */}
      <AnimatePresence>
        {activeAnalysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 p-5 sm:p-6 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-4"
          >
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                    className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </motion.div>
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
                  <motion.div
                    key={i}
                    whileHover={{ y: -1.5 }}
                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2 transition-shadow hover:shadow-xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </motion.div>
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/reports")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Dossier</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
