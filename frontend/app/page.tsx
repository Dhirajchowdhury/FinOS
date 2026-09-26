"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import {
  ShieldCheck,
  TrendingUp,
  BrainCircuit,
  Zap,
  Activity,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
  LineChart,
  PieChart,
  FileText,
  AlertTriangle,
  Scale,
  DollarSign,
} from "lucide-react";

export default function RootLandingPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If already authenticated, forward to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const agents = [
    {
      name: "Credit Agent",
      icon: DollarSign,
      color: "from-blue-500 to-indigo-600",
      description: "Automated CDS spread calculation, interest coverage ratio, and Altman Z-score solvency modeling.",
    },
    {
      name: "Risk Agent",
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-600",
      description: "Value at Risk (VaR), tail risk metrics, and stress-testing under macro shocks.",
    },
    {
      name: "Investment Agent",
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      description: "Discounted Cash Flow (DCF), WACC estimation, and long-term fundamental growth trajectories.",
    },
    {
      name: "Trading Agent",
      icon: Activity,
      color: "from-purple-500 to-violet-600",
      description: "Momentum indicators, order flow imbalance analysis, and tactical execution timing.",
    },
    {
      name: "Portfolio Agent",
      icon: PieChart,
      color: "from-cyan-500 to-blue-600",
      description: "Markowitz mean-variance optimization, Sharpe maximization, and rebalancing signals.",
    },
    {
      name: "Valuation Agent",
      icon: LineChart,
      color: "from-green-500 to-emerald-600",
      description: "Relative valuation multiples (P/E, EV/EBITDA, P/B) against institutional peer groups.",
    },
    {
      name: "Tax Agent",
      icon: Scale,
      color: "from-indigo-500 to-purple-600",
      description: "Effective tax rate analysis, deferred tax asset tracking, and jurisdictional optimization.",
    },
    {
      name: "Fraud Agent",
      icon: ShieldCheck,
      color: "from-red-500 to-rose-600",
      description: "Forensic Benford's law tests, revenue recognition anomaly detection, and red-flag screening.",
    },
    {
      name: "Regulatory Agent",
      icon: FileText,
      color: "from-yellow-500 to-amber-600",
      description: "SEC/SEBI statutory filing compliance, disclosure auditing, and ESG reporting standards.",
    },
    {
      name: "Report Agent",
      icon: BrainCircuit,
      color: "from-teal-500 to-emerald-600",
      description: "Synthesis of multi-agent execution graphs into institutional investment committee briefs.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Top Header / Navigation */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#060911]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 p-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white leading-none">
                Fin<span className="text-emerald-400">OS</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                FINANCIAL OPERATING SYSTEM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-900/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-sm transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>10-Agent Multi-Agent Orchestration Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.15] mb-6">
          Autonomous Financial Intelligence for <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Institutional Decision-Making</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          FinOS connects 10 specialized AI agents into a coordinated DAG graph execution engine. Analyze credit, risk, portfolio optimization, technical momentum, and forensic red flags simultaneously.
        </p>

        {/* Hero CTA Box */}
        <div className="max-w-md mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          {isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-mono">Welcome back, {user?.name || user?.email}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30"
              >
                <span>Enter FinOS Workspace</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <GoogleLoginButton />
              <p className="text-[11px] text-slate-500 font-medium">
                Single Sign-On powered by Google OAuth 2.0. No password required.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 10 Agents Grid Section */}
      <section className="relative z-10 py-16 border-t border-slate-800/80 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              The 10 FinOS Domain Agents
            </h2>
            <p className="text-sm text-slate-400">
              Each agent runs specialized financial models independently, passing verified evidence to downstream agents in the execution graph.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {agents.map((ag) => {
              const Icon = ag.icon;
              return (
                <div
                  key={ag.name}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ag.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {ag.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {ag.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                    <span>STATUS: ACTIVE</span>
                    <Zap className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-slate-800/80 bg-[#060911] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-slate-400">FinOS Engine Version 1.0.0 — Operational</span>
          </div>
          <p>© {new Date().getFullYear()} FinOS Intelligence Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

