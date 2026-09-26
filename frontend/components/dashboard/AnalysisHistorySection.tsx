"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MOCK_ANALYSIS_RECORDS } from "@/lib/mock/analysis";
import { ALL_AGENTS } from "@/lib/mock/agents";
import {
  History,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function AnalysisHistorySection() {
  const router = useRouter();

  // Display top 5 most recent records on the dashboard
  const displayRecords = MOCK_ANALYSIS_RECORDS.slice(0, 5);

  const getAgentColor = (agentName: string) => {
    const ag = ALL_AGENTS.find(
      (a) => a.name.toLowerCase().includes(agentName.toLowerCase()) || a.slug.toLowerCase() === agentName.toLowerCase()
    );
    return ag?.color.primary || "#10b981";
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Analysis History
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                {MOCK_ANALYSIS_RECORDS.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Your previous financial questions and AI-powered analyses
            </p>
          </div>
        </div>

        <Link
          href="/analysis/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline self-start sm:self-center transition"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Clean Financial Audit Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {displayRecords.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No analysis history yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Ask FinOS your first financial question to initiate a real 10-agent analysis.
            </p>
          </div>
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
                {displayRecords.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/analysis/${item.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-sm sm:max-w-md">
                        {item.query}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {item.agentsUsed.map((agentName) => (
                          <span
                            key={agentName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: getAgentColor(agentName) }}
                            />
                            {agentName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

