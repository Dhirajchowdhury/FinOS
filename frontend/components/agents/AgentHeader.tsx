"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Agent } from "@/types/agent";
import { ArrowLeft, Sparkles, Plus, Check, Bot } from "lucide-react";

interface AgentHeaderProps {
  agent: Agent;
  onNewAnalysis?: () => void;
}

export function AgentHeader({ agent, onNewAnalysis }: AgentHeaderProps) {
  const [isAdded, setIsAdded] = useState(true);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Agent Avatar */}
        <div
          className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.borderLight} ${agent.color.borderDark} border flex items-center justify-center shrink-0 ${agent.color.text} shadow-sm`}
        >
          <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>

        <div>
          {/* Back link & Category */}
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/agents"
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>All Agents</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {agent.category}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {agent.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {agent.shortDescription}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => setIsAdded(!isAdded)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
            isAdded
              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Pinned</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Dashboard</span>
            </>
          )}
        </button>

        {onNewAnalysis && (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        )}
      </div>
    </div>
  );
}
