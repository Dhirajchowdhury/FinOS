"use client";

import React, { useEffect, useState } from "react";
import { Agent, AgentHistoryItem } from "@/types/agent";
import { agentsApi } from "@/lib/api/agents";
import { Clock, CheckCircle2, AlertCircle, ArrowRight, Download } from "lucide-react";

interface AgentHistoryProps {
  agent: Agent;
}

export function AgentHistory({ agent }: AgentHistoryProps) {
  const [history, setHistory] = useState<AgentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const items = await agentsApi.getAgentHistory(agent.id);
      setHistory(items);
      setLoading(false);
    }
    load();
  }, [agent.id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading historical audit runs...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Execution & Query Log</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable audit record of past prompts and factor model invocations.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  &ldquo;{item.query}&rdquo;
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.summary}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.timestamp}
                </span>
                <span>•</span>
                <span>Confidence: {item.confidenceScore}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                type="button"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 transition"
                title="Download Log"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
