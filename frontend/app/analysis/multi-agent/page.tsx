"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PipelineVisualizer } from "@/components/analysis/PipelineVisualizer";
import { SignalMatrix } from "@/components/analysis/SignalMatrix";
import { UnifiedInsight } from "@/components/analysis/UnifiedInsight";
import { MOCK_MULTI_AGENT_SCENARIOS } from "@/lib/mock/analysis";
import { MultiAgentScenario } from "@/types/analysis";
import { analysisApi } from "@/lib/api/analysis";
import {
  Sparkles,
  Play,
  RotateCcw,
  Bot,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  Send,
  Loader2,
} from "lucide-react";

function MultiAgentContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [scenarios, setScenarios] = useState<MultiAgentScenario[]>(MOCK_MULTI_AGENT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    MOCK_MULTI_AGENT_SCENARIOS[0].id
  );
  const [customPrompt, setCustomPrompt] = useState(initialQuery);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<"routing" | "collaborating" | "resolving" | "completed">("completed");

  const currentScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  useEffect(() => {
    if (initialQuery) {
      setCustomPrompt(initialQuery);
    }
  }, [initialQuery]);

  const handleRunAnalysis = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    setPipelineStep("routing");

    setTimeout(() => {
      setPipelineStep("collaborating");
    }, 900);

    setTimeout(() => {
      setPipelineStep("resolving");
    }, 1900);

    setTimeout(() => {
      setPipelineStep("completed");
      setIsSynthesizing(false);
    }, 2800);
  };

  return (
    <AppShell
      headerTitle="Multi-Agent Collaborative Intelligence"
      headerSubtitle="Concurrent agent consensus, signal synthesis, and conflict resolution engine"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Banner */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Cross-Agent Orchestration
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-mono">Consensus Decision Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Multi-Agent Collaborative Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Unlike single-prompt chatbots, FinOS activates multiple specialized agents simultaneously, checks for conflicting assumptions, and builds a verified, explainable synthesis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
              <Cpu className="w-3.5 h-3.5" />
              <span>5 Concurrent Agents</span>
            </span>
          </div>
        </section>

        {/* Scenario Selector & Custom Query Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Pre-Configured Multi-Agent Scenario
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scenarios.map((sc) => {
                const isSelected = sc.id === activeScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setActiveScenarioId(sc.id);
                      setCustomPrompt(sc.userPrompt);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 ring-1 ring-purple-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {sc.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {sc.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {sc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Query Input */}
          <div className="pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Custom Multi-Agent Query
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask a cross-agent question (e.g. 'How will crude oil at $90 impact Indian equities & tax offsets?')"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <button
                onClick={handleRunAnalysis}
                disabled={isSynthesizing}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Multi-Agent Synthesis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 5-Step Pipeline Flow Visualizer */}
        <PipelineVisualizer
          query={customPrompt || currentScenario.userPrompt}
          involvedAgentIds={currentScenario.involvedAgentIds}
          currentStep={pipelineStep}
        />

        {/* Cross-Agent Signal Matrix & Conflict Resolution */}
        <SignalMatrix
          signals={currentScenario.signals}
          conflictResolution={currentScenario.conflictResolution}
        />

        {/* Final Consensus & Unified Insight */}
        <UnifiedInsight scenario={currentScenario} />
      </div>
    </AppShell>
  );
}

export default function MultiAgentAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-mono text-slate-400">Loading Multi-Agent Consensus Pipeline...</div>
          </div>
        </div>
      }
    >
      <MultiAgentContent />
    </Suspense>
  );
}
