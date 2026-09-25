"use client";

import React from "react";
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";
import {
  TrendingUp,
  Newspaper,
  Globe,
  ShieldAlert,
  Receipt,
  FileText,
  Zap,
  ShieldCheck,
  CreditCard,
  PieChart,
  Bot,
  ChevronRight,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  Newspaper,
  Globe,
  ShieldAlert,
  Receipt,
  FileText,
  Zap,
  ShieldCheck,
  CreditCard,
  PieChart,
};

interface AgentSelectorGridProps {
  onSelectAgent: (agent: Agent) => void;
  activeAgentId?: AgentId | null;
  searchQuery?: string;
}

export function AgentSelectorGrid({
  onSelectAgent,
  activeAgentId,
  searchQuery = "",
}: AgentSelectorGridProps) {
  const lowerQuery = searchQuery.toLowerCase().trim();

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
              FinOS Specialized AI Agents
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select any agent to enter its dedicated workspace or view live telemetry
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
          ● 10 Autonomous Units Active
        </span>
      </div>

      {/* Grid of 10 Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {ALL_AGENTS.map((agent, index) => {
          const IconComponent = ICON_MAP[agent.iconName] || Bot;
          const isSelected = activeAgentId === agent.id;

          // Check if agent is relevant to current search query
          const isRelevant =
            lowerQuery.length > 0 &&
            (agent.name.toLowerCase().includes(lowerQuery) ||
              agent.shortDescription.toLowerCase().includes(lowerQuery) ||
              agent.category.toLowerCase().includes(lowerQuery) ||
              agent.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
              agent.id.toLowerCase().includes(lowerQuery));

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelectAgent(agent)}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
              className={`group text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 ${
                isSelected
                  ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-xl ring-2 ring-emerald-500/60 scale-[1.02]"
                  : isRelevant
                  ? "bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900 border-emerald-400/80 dark:border-emerald-600/80 shadow-md ring-1 ring-emerald-500/30 hover:-translate-y-1 hover:shadow-lg"
                  : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800/90 text-slate-900 dark:text-white hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-md hover:-translate-y-1"
              }`}
            >
              {/* Highlight badge if relevant */}
              {isRelevant && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-2xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Relevant</span>
                </div>
              )}

              <div>
                {/* Header: Icon + Category + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${
                      isSelected
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : `${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.borderLight} ${agent.color.borderDark} ${agent.color.text}`
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {!isRelevant && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isSelected ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        Online
                      </span>
                    </div>
                  )}
                </div>

                {/* Agent Name */}
                <div
                  className={`text-xs font-black tracking-tight leading-tight mb-1 group-hover:text-emerald-500 transition-colors ${
                    isSelected ? "text-white" : "text-slate-900 dark:text-white"
                  }`}
                >
                  {agent.name}
                </div>

                {/* Category Pill */}
                <div className="mb-2">
                  <span
                    className={`text-[9px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {agent.category}
                  </span>
                </div>

                {/* Short Description */}
                <p
                  className={`text-[11px] leading-relaxed line-clamp-2 mb-3 ${
                    isSelected ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {agent.shortDescription}
                </p>
              </div>

              {/* Action Footer */}
              <div
                className={`pt-2.5 border-t flex items-center justify-between text-[10px] font-bold ${
                  isSelected
                    ? "border-slate-700 text-emerald-400"
                    : "border-slate-100 dark:border-slate-800/80 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <span className="group-hover:underline">Open Agent Workspace</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Large Green Glowing Generate Financial Report CTA Section - Placed Below All 10 Agent Cards */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-extrabold uppercase tracking-wider">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>FinOS Report Generation Engine</span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white max-w-md leading-snug">
          Consolidate multi-agent intelligence into an audit-ready executive dossier
        </h3>

        <Link
          href="/reports"
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-black text-base sm:text-lg shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 cursor-pointer border border-emerald-400/40"
        >
          <Sparkles className="w-5 h-5 text-emerald-100 animate-pulse shrink-0" />
          <span>Generate Financial Report</span>
          <ArrowRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-1.5 transition-transform shrink-0" />
        </Link>

        <p className="text-[11px] text-slate-400 font-medium">
          Instantly synthesizes findings across Investment, Risk, Tax, Macro, and 6 other agents
        </p>
      </div>
    </div>
  );
}


