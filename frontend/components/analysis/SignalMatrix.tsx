"use client";

import React from "react";
import { AgentSignal } from "@/types/analysis";
import { MOCK_AGENT_MAP } from "@/lib/mock/agents";
import { Bot, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface SignalMatrixProps {
  signals: AgentSignal[];
  conflictResolution?: {
    conflictDescription: string;
    resolutionExplanation: string;
    reconciledScore: number;
  };
}

export function SignalMatrix({ signals, conflictResolution }: SignalMatrixProps) {
  const getVerdictBadge = (verdict: AgentSignal["verdict"]) => {
    switch (verdict) {
      case "Bullish":
      case "Optimized":
      case "Low Risk":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Neutral":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "High Risk":
      case "Bearish":
      case "Rebalance Required":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Cross-Agent Signal Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Independent evaluations synthesized across domain-specific quantitative engines.
          </p>
        </div>
      </div>

      {/* Signal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {signals.map((sig, idx) => {
          const agent = MOCK_AGENT_MAP[sig.agentId];

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Agent Header & Verdict Badge */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {agent && (
                      <div className={`p-1.5 rounded-lg ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text}`}>
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {sig.agentName}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getVerdictBadge(
                      sig.verdict
                    )}`}
                  >
                    {sig.verdict}
                  </span>
                </div>

                {/* Finding */}
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug mb-1.5">
                  {sig.finding}
                </p>

                {/* Rationale */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {sig.rationale}
                </p>
              </div>

              {/* Data Point Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{sig.dataPoint}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {sig.confidence}% Conf.
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict Resolution Card (If Present) */}
      {conflictResolution && (
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
              FinOS Decision Engine Conflict Resolution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Detected Variance in Opinions:
              </span>
              <p className="text-xs leading-relaxed">{conflictResolution.conflictDescription}</p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-purple-800/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Reconciliation & Consensus Logic:
              </span>
              <p className="text-xs leading-relaxed">{conflictResolution.resolutionExplanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
