"use client";

import React from "react";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";
import {
  MessageSquare,
  Plus,
  ShieldCheck,
  Bot,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";

export interface Thread {
  id: string;
  title: string;
  time: string;
  agentId?: AgentId;
}

interface AgentSidebarProps {
  threads: Thread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  selectedAgentId: AgentId | null;
  onSelectAgent: (agent: Agent | null) => void;
}

export function AgentSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  selectedAgentId,
  onSelectAgent,
}: AgentSidebarProps) {
  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#090e1a] flex flex-col justify-between shrink-0 h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top: Inquiry Threads Header & New Thread Button */}
        <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Inquiry Threads
          </span>
          <button
            onClick={onNewThread}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Scrollable Conversation Threads List */}
        <div className="p-2 space-y-1 overflow-y-auto max-h-[220px] md:max-h-[240px] border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          {threads.map((t) => {
            const isActive = t.id === activeThreadId;
            return (
              <button
                key={t.id}
                onClick={() => onSelectThread(t.id)}
                className={`w-full p-2 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MessageSquare
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    isActive ? "text-emerald-500" : "text-slate-400"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.time}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* FinOS Agents Quick Access Section */}
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-100/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              FinOS Agents
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            10 Online
          </span>
        </div>

        <div className="p-2 space-y-0.5 overflow-y-auto flex-1 min-h-[160px]">
          {/* Unified FinOS Option */}
          <button
            onClick={() => onSelectAgent(null)}
            className={`w-full px-2.5 py-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedAgentId === null
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-4 h-4 shrink-0" />
              <span className="text-xs truncate">Ask FinOS (Unified)</span>
            </div>
            <Sparkles className="w-3 h-3 shrink-0 opacity-80" />
          </button>

          {/* 10 Specialized Agents */}
          {ALL_AGENTS.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className={`w-full px-2.5 py-1.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-800 text-white font-bold border border-slate-700 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: agent.accentColor }}
                  />
                  <span className="text-xs truncate">{agent.shortName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span className="truncate">Audit-indexed GraphRAG</span>
      </div>
    </div>
  );
}
