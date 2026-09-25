"use client";

import React from "react";
import { Activity, Database, Cpu, Wifi } from "lucide-react";

export function SystemStatus() {
  const indicators = [
    {
      label: "Agents Status",
      value: "10 Online",
      icon: Cpu,
      color: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    {
      label: "Market Telemetry",
      value: "Sub-second (<45ms)",
      icon: Wifi,
      color: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
    },
    {
      label: "Knowledge Graph",
      value: "GraphRAG Active",
      icon: Database,
      color: "text-purple-600 dark:text-purple-400",
      dot: "bg-purple-500",
    },
    {
      label: "Decision Engine",
      value: "Consensus Ready",
      icon: Activity,
      color: "text-teal-600 dark:text-teal-400",
      dot: "bg-teal-500",
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          FinOS System Telemetry:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {indicators.map((ind, idx) => {
          const Icon = ind.icon;
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${ind.dot}`} />
              <Icon className={`w-3.5 h-3.5 ${ind.color}`} />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {ind.label}:
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                {ind.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
