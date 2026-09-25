"use client";

import React from "react";
import Link from "next/link";
import { Agent } from "@/types/agent";
import { AgentCard } from "./AgentCard";
import { ArrowRight, Bot, Sparkles } from "lucide-react";

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  const orderedIds = [
    "investment",
    "news",
    "macro",
    "risk",
    "tax",
    "report",
    "trading",
    "fraud",
    "credit",
    "portfolio",
  ];

  const sortedAgents = [...agents].sort((a, b) => {
    const idxA = orderedIds.indexOf(a.id);
    const idxB = orderedIds.indexOf(b.id);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
              Our AI Agents
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              10 Online
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Specialized agents working together to give you comprehensive financial insights
          </p>
        </div>

        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline self-start sm:self-center transition"
        >
          <span>View All Agents</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: 5 columns on desktop (5x2), 2-3 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {sortedAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </section>
  );
}
