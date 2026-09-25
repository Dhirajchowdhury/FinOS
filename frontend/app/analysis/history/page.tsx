"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_ANALYSIS_RECORDS } from "@/lib/mock/analysis";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { AnalysisHistoryRecord } from "@/types/analysis";
import {
  History,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";

export default function AnalysisHistoryPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filterTabs = [
    "All",
    "Stocks",
    "Markets",
    "Portfolio",
    "Risk",
    "Tax",
    "Payslip",
    "Reports",
  ];

  const filteredRecords = MOCK_ANALYSIS_RECORDS.filter((rec) => {
    // Filter matching
    const matchesFilter =
      activeFilter === "All" ||
      rec.type.toLowerCase() === activeFilter.toLowerCase() ||
      (activeFilter === "Reports" && rec.type.toLowerCase().includes("report"));

    // Search matching
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesFilter;

    const matchesSearch =
      rec.title.toLowerCase().includes(term) ||
      rec.query.toLowerCase().includes(term) ||
      rec.type.toLowerCase().includes(term) ||
      rec.agentsUsed.some((ag) => ag.toLowerCase().includes(term)) ||
      (rec.marketInfo?.symbol && rec.marketInfo.symbol.toLowerCase().includes(term)) ||
      rec.summary.toLowerCase().includes(term) ||
      rec.keyFindings.some((k) => k.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  const getAgentColor = (agentName: string) => {
    const ag = ALL_AGENTS.find(
      (a) => a.name.toLowerCase().includes(agentName.toLowerCase()) || a.slug.toLowerCase() === agentName.toLowerCase()
    );
    return ag?.color.primary || "#10b981";
  };

  return (
    <AppShell
      headerTitle="Analysis History"
      headerSubtitle="Audit trail of multi-agent collaborative financial inquiries and decision trees"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Search & Filter Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search your analysis history by query, company, type, or agent..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{filteredRecords.length} Analyses Found</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Institutional Analysis Table */}
        <div className="rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          {filteredRecords.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No matching analyses found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different keyword like &quot;Reliance&quot;, &quot;Risk&quot;, &quot;RBI&quot;, or reset your filter.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("All");
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 sm:px-6">QUERY / TITLE</th>
                    <th className="py-3 px-3">TYPE</th>
                    <th className="py-3 px-3">AGENTS USED</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-4 sm:px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {filteredRecords.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/analysis/${item.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* Query / Title */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-sm sm:max-w-md">
                          {item.query}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                          {item.type}
                        </span>
                      </td>

                      {/* Agents Used */}
                      <td className="py-4 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[220px]">
                          {item.agentsUsed.map((agentName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-300"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: getAgentColor(agentName) }}
                              />
                              <span>{agentName}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                        {item.date}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Link
                          href={`/analysis/${item.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline group-hover:translate-x-1 transition-transform"
                        >
                          <span>View Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
