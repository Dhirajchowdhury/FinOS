"use client";

import React, { useState } from "react";
import { Agent } from "@/types/agent";
import { AgentAnalysis } from "@/components/agents/AgentAnalysis";
import { AgentChat } from "@/components/agents/AgentChat";
import {
  ArrowLeft,
  Bot,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
  TrendingUp,
  Newspaper,
  Globe,
  ShieldAlert,
  Receipt,
  FileText,
  ShieldCheck as ShieldIcon,
  CreditCard,
  PieChart,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp,
  Newspaper,
  Globe,
  ShieldAlert,
  Receipt,
  FileText,
  Zap,
  ShieldCheck: ShieldIcon,
  CreditCard,
  PieChart,
};

interface AgentWorkspacePanelProps {
  agent: Agent;
  onBack: () => void;
  onInvolveAgents?: (suggestedQuery: string) => void;
}

export function AgentWorkspacePanel({
  agent,
  onBack,
  onInvolveAgents,
}: AgentWorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");
  const IconComponent = ICON_MAP[agent.iconName] || Bot;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Navigation & Agent Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Back to All Agents Button */}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← All Agents</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Selected Agent Identity */}
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.borderLight} ${agent.color.borderDark} ${agent.color.text} shadow-2xs`}
            >
              <IconComponent className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {agent.name}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ● Online
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                {agent.shortDescription}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Telemetry Analysis vs Interactive Chat */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "analysis"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Telemetry &amp; Audit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "chat"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Agent Chat</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeTab === "analysis" ? (
        <AgentAnalysis agent={agent} />
      ) : (
        <AgentChat agent={agent} onInvolveAgents={onInvolveAgents} />
      )}
    </div>
  );
}
