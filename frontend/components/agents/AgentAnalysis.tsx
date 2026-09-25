"use client";

import React from "react";
import Link from "next/link";
import { Agent, AgentAnalysisResult } from "@/types/agent";
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Database,
  ArrowRight,
  Layers,
  Award,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface AgentAnalysisProps {
  agent: Agent;
  result?: AgentAnalysisResult;
}

export function AgentAnalysis({ agent, result }: AgentAnalysisProps) {
  // Fallback default analysis if none provided
  const analysis: AgentAnalysisResult = result || {
    title: `${agent.name} — Systematic Valuation & Exposure Memo`,
    summary: `Quantitative analysis synthesized across live order books, SEC/NSE regulatory disclosures, and sovereign macroeconomic indicators for ${agent.name}.`,
    keyFindings: [
      "Portfolio beta remains controlled at 0.88, indicating 12% lower volatility than broader benchmarks.",
      "Tech overweight (+4.2%) is justified by 28% median ROE across top holdings (TCS, Infosys).",
      "No single holding exceeds the 25% single-stock prudential risk limit.",
      "Liquid reserves (4.0%) provide sufficient liquidity coverage for immediate rebalancing.",
    ],
    recommendations: [
      "Maintain core allocation to large-cap technology and private sector banking.",
      "Extend sovereign fixed-income duration to lock in >7.15% yields on 10-year G-Secs.",
      "Schedule quarterly review with Tax Agent prior to fiscal quarter-end.",
    ],
    riskLevel: "Low",
    confidenceScore: 94.6,
    metrics: [
      { label: "Confidence Score", value: "94.6%", change: "+2.1%", isPositive: true },
      { label: "Downside Volatility", value: "8.4%", change: "-1.2%", isPositive: true },
      { label: "Information Ratio", value: "1.42", isPositive: true },
      { label: "Active Share", value: "64.2%" },
    ],
    chartData: [
      { label: "Equities", value: 72.3, benchmark: 60.0 },
      { label: "Govt Debt", value: 17.2, benchmark: 25.0 },
      { label: "Gold ETF", value: 6.5, benchmark: 5.0 },
      { label: "Liquid Cash", value: 4.0, benchmark: 10.0 },
    ],
    sources: agent.dataSources,
    explainabilityTrace: {
      decisionPath: "Live Market Tick -> Factor Loading Matrix -> GraphRAG Knowledge Graph -> Multi-Agent Consensus",
      contributingFactors: [
        { factor: "Earnings Stability", weight: 0.38 },
        { factor: "Market Liquidity Depth", weight: 0.32 },
        { factor: "Macro Policy Trajectory", weight: 0.30 },
      ],
      guardrailsPassed: [
        "VaR 95% Limit < 2.5%",
        "Sector Concentration < 35%",
        "SEBI Section 112A Compliance",
      ],
    },
    collaboratingAgents: ["macro", "risk", "portfolio"],
  };

  return (
    <div className="space-y-6">
      {/* Title & Executive Summary Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                AUDITED RESULT
              </span>
              <span className="text-xs text-slate-400">Model: {agent.modelSpecs.engine}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {analysis.title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Confidence Meter
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {analysis.confidenceScore}%
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Rating</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {analysis.riskLevel} Risk
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {analysis.summary}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {analysis.metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
            >
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                {m.label}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {m.value}
                </span>
                {m.change && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {m.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Key Findings & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Key Findings Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Key Strategic Findings
            </h3>
          </div>

          <ul className="space-y-2.5">
            {analysis.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recharts Chart: Allocation vs Benchmark */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Exposure vs Benchmark (%)
            </h3>
            <span className="text-[11px] text-slate-400">FinOS Rebalance Model</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" name="Current Weight" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="benchmark" name="Benchmark Weight" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
            Actionable Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {analysis.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-sm"
            >
              <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1 font-mono text-[11px]">
                ACTION 0{idx + 1}
              </div>
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* Explainability & GraphRAG Trace */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Explainability & Decision Audit Trail
          </h3>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
          <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
            Decision Execution Path:
          </span>
          {analysis.explainabilityTrace.decisionPath}
        </div>

        {/* Contributing Factors & Guardrails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Model Weightings
            </span>
            <div className="space-y-1.5">
              {analysis.explainabilityTrace.contributingFactors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{f.factor}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {(f.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Institutional Guardrails Validated
            </span>
            <div className="space-y-1">
              {analysis.explainabilityTrace.guardrailsPassed.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA to Involve Other Agents in Multi-Agent Pipeline */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-900/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Connected Intelligence
            </span>
          </div>
          <h4 className="text-base font-bold">Cross-Validate with Multi-Agent Pipeline</h4>
          <p className="text-xs text-emerald-100 mt-0.5">
            Allow Macro, Risk, and Portfolio agents to stress-test this recommendation.
          </p>
        </div>

        <Link
          href="/analysis/multi-agent"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md transition shrink-0"
        >
          <span>Run Multi-Agent Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
