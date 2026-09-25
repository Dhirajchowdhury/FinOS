"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MultiAgentScenario } from "@/types/analysis";
import {
  Award,
  CheckCircle2,
  Download,
  Share2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Clock,
} from "lucide-react";

interface UnifiedInsightProps {
  scenario: MultiAgentScenario;
}

export function UnifiedInsight({ scenario }: UnifiedInsightProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `FinOS Multi-Agent Consensus: ${scenario.consensusVerdict}\nScore: ${scenario.consensusScore}%\nAudit ID: ${scenario.explainability.auditId}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Unified Consensus Header Card */}
      <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/40">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesized Multi-Agent Consensus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {scenario.consensusVerdict}
            </h2>
          </div>

          <div className="flex items-center gap-4 self-start sm:self-center shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                Consensus Score
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {scenario.consensusScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Unified Strategic Insights List */}
        <div>
          <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block mb-2">
            Consolidated Executive Insights
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {scenario.unifiedInsights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export as Formal Report</span>
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : "Share Audit Summary"}</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-emerald-300/80">
            Audit ID: {scenario.explainability.auditId}
          </span>
        </div>
      </div>

      {/* Action Plan: Immediate vs Medium Term */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Immediate Steps */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Immediate Action Plan (0 - 48 Hours)
            </h4>
          </div>

          <ul className="space-y-2">
            {scenario.actionPlan.immediate.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Medium-Term Monitoring */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Medium-Term Monitoring & Guardrails
            </h4>
          </div>

          <ul className="space-y-2">
            {scenario.actionPlan.mediumTerm.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* GraphRAG Context & Agent Weightings */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            GraphRAG Context Traversal
          </h4>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
          {scenario.explainability.graphRAGContext}
        </p>

        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Consensus Weight Contribution by Agent
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenario.explainability.decisionEngineWeighting.map((w, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs"
              >
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block truncate">
                  {w.agent}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {(w.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
