"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { useTheme } from "@/hooks/useTheme";
import {
  Sparkles,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  Bot,
  Zap,
  CheckCircle2,
  TrendingUp,
  Lock,
  ChevronRight,
  Sun,
  Moon,
  Cpu,
  BarChart3,
  Network,
} from "lucide-react";

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const [activeAgentId, setActiveAgentId] = useState("investment");

  const selectedAgent = ALL_AGENTS.find((a) => a.id === activeAgentId) || ALL_AGENTS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] text-slate-900 dark:text-white transition-colors duration-300">
      {/* ================= NAVIGATION BAR ================= */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white p-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Fin<span className="text-emerald-500">OS</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                FINANCIAL OPERATING SYSTEM
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#ecosystem" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              10-Agent Ecosystem
            </a>
            <a href="#architecture" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Architecture
            </a>
            <a href="#scenarios" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Cross-Agent Scenarios
            </a>
            <a href="#security" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Enterprise Security
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg"
            >
              <span>Launch FinOS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 dark:border-slate-800/80">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 finos-grid-bg opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Version Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FinOS v2.4 • Multi-Agent Financial Intelligence Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.12]">
              A Unified AI Operating System for{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                Financial Decision-Making
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              FinOS is not a generic chatbot. It orchestrates 10 specialized financial AI agents to analyze market shifts, evaluate cross-asset risk, calculate tax liabilities, and generate explainable institutional dossiers in real-time.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2"
              >
                <span>Get Started with FinOS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Explore Live Command Center</span>
              </Link>
              <Link
                href="/analysis/multi-agent"
                className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Network className="w-4 h-4 text-purple-500" />
                <span>Multi-Agent Pipeline</span>
              </Link>
            </div>
          </div>

          {/* System Metrics Bar */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xs">
            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">10</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Autonomous Agents
              </div>
            </div>
            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">&lt; 450ms</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Telemetry Synthesis
              </div>
            </div>
            <div className="p-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">99.98%</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Feed Uptime
              </div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">100%</div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Audit Explainability
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= INTERACTIVE 10-AGENT ECOSYSTEM ================= */}
      <section id="ecosystem" className="py-20 bg-slate-50/50 dark:bg-[#06090f] border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              The 10-Agent Collaborative Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Unlike generic AI, FinOS delegates financial subproblems to specialized, domain-tuned agents that run concurrently and synthesize their findings into an explainable consensus.
            </p>
          </div>

          {/* Interactive Agent Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Agent Selectors (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2 sm:gap-2.5">
              {ALL_AGENTS.map((agent) => {
                const isSelected = agent.id === activeAgentId;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setActiveAgentId(agent.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-slate-900 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500"
                        : "bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: agent.accentColor }}
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {agent.shortName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                      {agent.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Agent Detail Active Viewer (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: selectedAgent.accentColor }}
                    />
                    <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                      {selectedAgent.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                    {selectedAgent.description}
                  </p>
                </div>

                <Link
                  href={`/agents/${selectedAgent.id}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 shrink-0 hover:bg-emerald-100 transition-colors"
                >
                  <span>Launch Agent</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Specs & Capabilities */}
              <div className="grid grid-cols-3 gap-3 my-5 py-3 border-y border-slate-100 dark:border-slate-800 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Model Engine</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedAgent.model}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Latency SLA</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedAgent.latency}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">State</div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{selectedAgent.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Autonomous Capabilities
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Example Query Prompt
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs italic text-slate-700 dark:text-slate-300">
                    &ldquo;{selectedAgent.samplePrompt}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ARCHITECTURAL PILLARS ================= */}
      <section id="architecture" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Engineered for Financial Rigor
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Generic LLMs hallucinate numbers. FinOS grounds every conclusion in deterministic APIs, real-time tick feeds, and sovereign regulatory frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Multi-Agent Consensus Matrix
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When macro conditions change, Macro, News, Risk, and Investment agents debate simultaneously. Disagreements are reconciled using weighted confidence scoring.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              GraphRAG & Ground Truth
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every numeric output links to verified citations—from SEC 10-K filings and RBI monetary policy statements to live order book depth and exchange feeds.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Real-Time Risk Guardrails
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deterministic VaR triggers, volatility stress testing, and anomaly flags execute before any recommendation reaches your portfolio screen.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Deploy FinOS into Your Financial Workflow
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Experience institutional intelligence with the 10-agent multi-model network. Full security, zero blind spots, explainable decisions.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <span>Access FinOS Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all"
            >
              View Command Center
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              F
            </div>
            <span className="font-bold text-slate-900 dark:text-white">FinOS Platform</span>
            <span>— Institutional Financial Operating System</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} FinOS Inc. Cryptographic SHA-256 telemetry verified.
          </div>
        </div>
      </footer>
    </div>
  );
}
