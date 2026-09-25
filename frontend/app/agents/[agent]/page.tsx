"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { AppShell } from "@/components/layout/AppShell";
import { AgentHeader } from "@/components/agents/AgentHeader";
import { AgentChat } from "@/components/agents/AgentChat";
import { AgentAnalysis } from "@/components/agents/AgentAnalysis";
import { AgentHistory } from "@/components/agents/AgentHistory";
import {
  MessageSquare,
  BarChart3,
  History,
  Bot,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentSlug = (params?.agent as string) || "investment";

  const [activeTab, setActiveTab] = useState<"chat" | "analysis" | "history">("chat");

  const agent = ALL_AGENTS.find((a) => a.id === agentSlug) || ALL_AGENTS[0];

  const handleInvolveAgents = (suggestedQuery: string) => {
    // Navigate to multi-agent page with this query pre-filled
    router.push(`/analysis/multi-agent?q=${encodeURIComponent(suggestedQuery)}`);
  };

  return (
    <AppShell headerTitle={agent.name} headerSubtitle={agent.shortDescription}>
      <div className="space-y-6">
        {/* Agent Top Header Card */}
        <AgentHeader agent={agent} />

        {/* Dynamic Navigation Tabs & Cross-Agent Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          {/* Main Tab Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interactive Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "analysis"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Structured Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit History</span>
            </button>
          </div>

          {/* Quick Peer Agent Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">Switch Agent:</span>
            {ALL_AGENTS.filter((a) => a.id !== agent.id)
              .slice(0, 4)
              .map((peer) => (
                <Link
                  key={peer.id}
                  href={`/agents/${peer.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: peer.accentColor }} />
                  <span>{peer.shortName}</span>
                </Link>
              ))}
            <Link
              href="/agents"
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline shrink-0 px-1"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Active Tab View */}
        <div className="transition-all duration-200">
          {activeTab === "chat" && (
            <AgentChat agent={agent} onInvolveAgents={handleInvolveAgents} />
          )}

          {activeTab === "analysis" && (
            <AgentAnalysis agent={agent} />
          )}

          {activeTab === "history" && (
            <AgentHistory agent={agent} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
