"use client";

import React from "react";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { AgentId } from "@/types/agent";
import { ArrowDown, Bot, ShieldCheck, Sparkles } from "lucide-react";

interface AgentCollaborationFlowProps {
  agentsConsulted: AgentId[];
  agentDetails?: Record<string, { id: AgentId; status?: string; data_quality?: string }>;
  consensusScore?: number;
  onAgentClick?: (agentId: AgentId) => void;
}

export function AgentCollaborationFlow({
  agentsConsulted,
  agentDetails,
  consensusScore,
  onAgentClick,
}: AgentCollaborationFlowProps) {
  const activeAgents = ALL_AGENTS.filter((a) => agentsConsulted.includes(a.id));

  return (
    <div className="my-3 p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            FinOS Multi-Agent Collaboration Network
          </span>
        </div>
        {consensusScore !== undefined && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
            {consensusScore}% Confidence
          </span>
        )}
      </div>

      {/* Flow Visualization Container */}
      <div className="flex flex-col items-center gap-2 text-center py-1">
        {/* Step 1: User Query / Ask FinOS */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 shadow-2xs">
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ask FinOS Engine</span>
        </div>

        {/* Down Arrow */}
        <ArrowDown className="w-3.5 h-3.5 text-slate-500 animate-bounce" />

        {/* Step 2: Parallel Agents Nodes */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2 py-1">
          {activeAgents.map((ag) => {
            const detail = agentDetails?.[ag.id];
            const status = detail?.status || "EXECUTED";
            const statusColor =
              status === "REAL"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : status === "PARTIAL"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : status === "DATA_UNAVAILABLE"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-700 text-slate-300 border-slate-600";

            return (
              <button
                key={ag.id}
                onClick={() => onAgentClick && onAgentClick(ag.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: `${ag.accentColor}15`,
                  borderColor: `${ag.accentColor}60`,
                  color: "#ffffff",
                }}
                title={`Click to open ${ag.name}`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ag.accentColor }}
                />
                <span>{ag.shortName}</span>
                {status && (
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${statusColor}`}>
                    {status}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Down Arrow */}
        <ArrowDown className="w-3.5 h-3.5 text-slate-500" />

        {/* Step 3: FinOS Synthesis Layer */}
        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs font-extrabold text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Report Agent Synthesis ({activeAgents.length} Agents Output)</span>
        </div>
      </div>
    </div>
  );
}
