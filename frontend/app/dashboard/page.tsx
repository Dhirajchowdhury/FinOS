"use client";

import React, { useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AskFinOSHero } from "@/components/dashboard/AskFinOSHero";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AgentGrid } from "@/components/dashboard/AgentGrid";
import { AnalysisHistorySection } from "@/components/dashboard/AnalysisHistorySection";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { useAuth } from "@/hooks/useAuth";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";

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
      <motion.div
        variants={staggerContainer(0.08, 0.02)}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Workspace Greeting Header */}
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              {timeGreeting}, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Your financial intelligence workspace
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sovereign GNN v2.4 Active</span>
            </span>
          </div>
        </motion.div>

        {/* 1. Hero Section: Ask FinOS */}
        <motion.div variants={staggerItem}>
          <AskFinOSHero />
        </motion.div>

        {/* 2. QUICK ACTIONS (3 Prominent Cards) */}
        <motion.div variants={staggerItem}>
          <QuickActions />
        </motion.div>

        {/* 3. OUR AI AGENTS (10 agents in 5x2 grid) */}
        <motion.div variants={staggerItem}>
          <AgentGrid agents={ALL_AGENTS} />
        </motion.div>

        {/* 4. ANALYSIS HISTORY (Audit Table) */}
        <motion.div variants={staggerItem}>
          <AnalysisHistorySection />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
