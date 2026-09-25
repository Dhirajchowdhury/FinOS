"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { PerformanceChart } from "@/components/portfolio/PerformanceChart";
import { AllocationDonut } from "@/components/portfolio/AllocationDonut";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { staggerContainer, staggerItem, cardHoverVariants } from "@/lib/motion";
import { MOCK_HOLDINGS, MOCK_PORTFOLIO_SUMMARY } from "@/lib/mock/portfolio";
import {
  TrendingUp,
  Shield,
  PieChart,
  Bot,
  ArrowRight,
  Sparkles,
  Download,
  AlertTriangle,
  RefreshCw,
  Wallet,
} from "lucide-react";

export default function PortfolioPage() {
  const summary = MOCK_PORTFOLIO_SUMMARY;
  const holdings = MOCK_HOLDINGS;

  const [isRebalancing, setIsRebalancing] = useState(false);

  const handleSimulateRebalance = () => {
    setIsRebalancing(true);
    setTimeout(() => {
      setIsRebalancing(false);
    }, 1500);
  };

  return (
    <AppShell
      headerTitle="Portfolio Analytics"
      headerSubtitle="Multi-asset holdings, factor risk attribution, and NAV reconciliation"
    >
      <div className="space-y-6">
        {/* Portfolio Banner */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Institutional Treasury
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-mono">Real-time NAV Reconciliation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Multi-Asset Portfolio Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Monitored autonomously by the Portfolio and Risk agents with continuous factor risk decomposition and tax lot tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSimulateRebalance}
              disabled={isRebalancing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRebalancing ? "animate-spin" : ""}`} />
              <span>{isRebalancing ? "Auditing Lots..." : "Run Lot Audit"}</span>
            </motion.button>

            <MagneticButton strength={3}>
              <Link
                href="/reports"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dossier</span>
              </Link>
            </MagneticButton>
          </div>
        </section>

        {/* Top KPI Metric Cards */}
        <motion.div
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Portfolio Value</div>
            <div className="text-2xl font-black text-slate-950 dark:text-white font-mono mt-1">
              <AnimatedNumber value={8871765} prefix="₹" formatIndian durationMs={900} />
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">Updated {summary.lastUpdated}</div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Day P&amp;L (Today)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              <AnimatedNumber value={124350} prefix="+₹" formatIndian durationMs={900} />
            </div>
            <div className="text-[11px] font-bold text-emerald-600 font-mono mt-0.5">+1.42% Active Return</div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">All-Time Unrealized Gain</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              <AnimatedNumber value={1771765} prefix="+₹" formatIndian durationMs={900} />
            </div>
            <div className="text-[11px] font-bold text-emerald-600 font-mono mt-0.5">+24.95% Cumulative</div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Liquid Cash &amp; Reserves</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
              <AnimatedNumber value={354200} prefix="₹" formatIndian durationMs={900} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">4.0% Ready Dry Powder</div>
          </motion.div>
        </motion.div>

        {/* Risk Guardrails & Statistical Factor Loadings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Institutional Risk Metrics (Risk Agent Verified)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">Sharpe Ratio</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.riskMetrics.sharpeRatio}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">Sortino Ratio</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.riskMetrics.sortinoRatio}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">Beta (NIFTY)</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.riskMetrics.beta}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">95% Daily VaR</div>
              <div className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {summary.riskMetrics.valueAtRisk95}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">Max Drawdown</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.riskMetrics.maxDrawdown}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-[10px] text-slate-400 font-sans">Annual Volatility</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.riskMetrics.annualizedVolatility}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row: Performance Chart (7 cols) + Allocation Donut (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <PerformanceChart />
          </div>
          <div className="lg:col-span-4 flex">
            <div className="w-full">
              <AllocationDonut />
            </div>
          </div>
        </div>

        {/* Holdings Table */}
        <HoldingsTable holdings={holdings} />

        {/* Agent AI Rebalancing Advisory Callout */}
        <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Portfolio Agent Recommendation
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  Target Weight Optimal
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Equity allocation is slightly overweight tech (+4.2%) due to recent NVIDIA and TCS appreciation. Recommend directing upcoming monthly cash inflow toward G-Sec 2034 sovereign debt to lock in 7.18% coupon.
              </p>
            </div>
          </div>

          <Link
            href="/agents/portfolio"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-center"
          >
            <span>Consult Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
