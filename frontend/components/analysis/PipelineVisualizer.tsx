"use client";

import React from "react";
import { motion } from "framer-motion";
import { AgentId } from "@/types/agent";
import { MOCK_AGENT_MAP } from "@/lib/mock/agents";
import { Bot, ArrowRight, Activity, Cpu, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface PipelineVisualizerProps {
  query: string;
  involvedAgentIds: AgentId[];
  currentStep?: "routing" | "collaborating" | "resolving" | "completed";
}

export function PipelineVisualizer({
  query,
  involvedAgentIds,
  currentStep = "completed",
}: PipelineVisualizerProps) {
  const stepIndices: Record<string, number> = {
    routing: 1,
    collaborating: 2,
    resolving: 3,
    completed: 4,
  };

  const currentIdx = stepIndices[currentStep] ?? 4;

  const steps = [
    { key: "query", title: "1. Query Ingestion", desc: "Entity extraction & intent mapping" },
    { key: "routing", title: "2. Agent Selection", desc: `${involvedAgentIds.length} agents activated` },
    { key: "collaborating", title: "3. Cross-Agent Signals", desc: "Factor & telemetry exchange" },
    { key: "consensus", title: "4. Decision Engine", desc: "Consensus & conflict resolution" },
    { key: "insight", title: "5. Unified Insight", desc: "Actionable explainable strategy" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Multi-Agent Collaborative Architecture</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Distributed Intelligence Pipeline
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            GraphRAG Consensus Engine Live
          </span>
        </div>
      </div>

      {/* Query Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Active Objective / User Prompt
        </span>
        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
          &ldquo;{query}&rdquo;
        </p>
      </div>

      {/* Multi-Agent Orchestration Visual Diagram */}
      <div className="relative pt-2">
        {/* Horizontal connector bar on desktop */}
        <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(currentIdx / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
          {steps.map((st, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = idx > currentIdx;

            return (
              <motion.div
                key={st.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className={`p-3 rounded-xl border shadow-xs flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "bg-purple-50/40 dark:bg-purple-950/30 border-purple-500 ring-1 ring-purple-500"
                    : isCompleted
                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60"
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-mono font-bold block mb-1 ${
                      isCurrent
                        ? "text-purple-600 dark:text-purple-400"
                        : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    PHASE 0{idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{st.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] font-semibold">
                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </div>
                  ) : isCompleted || currentStep === "completed" ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Validated</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Pending</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Activated Agents Roster */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
          Contributing Agent Cluster ({involvedAgentIds.length} Agents)
        </span>

        <div className="flex flex-wrap gap-2">
          {involvedAgentIds.map((id, index) => {
            const agent = MOCK_AGENT_MAP[id];
            if (!agent) return null;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                whileHover={{ y: -1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <div className={`p-1 rounded-lg ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text}`}>
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                    {agent.name}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-tight">
                    {agent.category}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
