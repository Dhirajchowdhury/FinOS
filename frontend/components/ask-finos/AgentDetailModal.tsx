"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Agent } from "@/types/agent";
import {
  X,
  Bot,
  Zap,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
  TrendingUp,
  Newspaper,
  Globe,
  ShieldAlert,
  Receipt,
  FileText,
  ShieldCheck,
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
  ShieldCheck,
  CreditCard,
  PieChart,
};

interface AgentDetailModalProps {
  agent: Agent | null;
  onClose: () => void;
  onStartAgentChat: (agent: Agent, query?: string) => void;
}

export function AgentDetailModal({
  agent,
  onClose,
  onStartAgentChat,
}: AgentDetailModalProps) {
  const [customQuery, setCustomQuery] = useState("");

  if (!agent) return null;

  const IconComponent = ICON_MAP[agent.iconName] || Bot;

  const handlePromptClick = (prompt: string) => {
    onStartAgentChat(agent, prompt);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    onStartAgentChat(agent, customQuery.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Card */}
        <div className="p-5 sm:p-6 bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-2xl ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.borderLight} ${agent.color.borderDark} border flex items-center justify-center shrink-0 ${agent.color.text} shadow-sm`}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  {agent.category} Agent
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● Online / Available
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {agent.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                {agent.shortDescription}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Detailed Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Agent Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              {agent.fullDescription}
            </p>
          </div>

          {/* Model Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Engine</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate">
                {agent.modelSpecs.engine}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Latency SLA</div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {agent.modelSpecs.latency}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Context</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {agent.modelSpecs.contextWindow}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Confidence</div>
              <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                {agent.modelSpecs.confidenceThreshold}
              </div>
            </div>
          </div>

          {/* Core Capabilities */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Core Capabilities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {agent.capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Prompts */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Suggested Prompts for {agent.shortName}
            </h3>
            <div className="space-y-2">
              {agent.samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition flex items-center justify-between group cursor-pointer"
                >
                  <span>"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Box for this Agent */}
          <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ask {agent.name} Anything
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder={`Ask ${agent.shortName} specific questions...`}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="submit"
                disabled={!customQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 transition shrink-0 cursor-pointer"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Dedicated workspace &amp; interactive telemetry available
          </span>
          <Link
            href={`/agents/${agent.id}`}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Open Dedicated Agent Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
