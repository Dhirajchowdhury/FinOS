"use client";

import React, { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AskFinOSHero } from "@/components/dashboard/AskFinOSHero";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { CompactPortfolioCard } from "@/components/dashboard/CompactPortfolioCard";
import { CompactMarketCard } from "@/components/dashboard/CompactMarketCard";
import { AgentGrid } from "@/components/dashboard/AgentGrid";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const displayName = user?.name?.split(" ")[0] || "Anuj";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Workspace Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                All Systems Operational • 10/10 Agents Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              {timeGreeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Your financial intelligence workspace
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
              Sovereign GNN v2.4 Active
            </span>
          </div>
        </div>

        {/* Hero Section: Ask FinOS */}
        <AskFinOSHero />

        {/* Quick Actions (6 Items) */}
        <DashboardQuickActions />

        {/* Dual Cards: Compact Portfolio & Compact Market Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <CompactPortfolioCard />
          <CompactMarketCard />
        </div>

        {/* Our AI Agents Section (5x2 Desktop Grid) */}
        <AgentGrid agents={ALL_AGENTS} />
      </div>
    </AppShell>
  );
}
