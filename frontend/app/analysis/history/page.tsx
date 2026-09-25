"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ALL_AGENTS } from "@/lib/mock/agents";
import {
  History,
  Bot,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  X,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";

interface AnalysisHistoryRecord {
  id: string;
  query: string;
  category: string;
  date: string;
  status: "Completed" | "Processing" | "Archived";
  agentsUsed: string[];
  consensusVerdict: string;
  consensusScore: number;
  findings: string[];
  actions: string[];
}

export default function AnalysisHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryRecord | null>(null);

  const historyRecords: AnalysisHistoryRecord[] = [
    {
      id: "ah-1",
      query: "How will an RBI rate hike affect my portfolio?",
      category: "Macroeconomic",
      date: "Sep 24, 2026 • 14:15",
      status: "Completed",
      agentsUsed: ["macro", "news", "risk", "portfolio", "investment"],
      consensusVerdict: "Extend Fixed Income Duration (+0.6Y) & Accumulate Banking",
      consensusScore: 91,
      findings: [
        "Core CPI cooling to 3.8% keeps monetary tightening probability under 15%.",
        "Portfolio fixed-income duration is insulated; delta 1-day 95% VaR is negligible (+₹8,400).",
        "HDFC Bank (20.8% weight) exhibits positive net interest margin sensitivity to steady rates.",
      ],
      actions: [
        "Maintain current equity allocation while incrementally extending duration on G-Secs.",
        "Set trailing alerts on banking multiples.",
      ],
    },
    {
      id: "ah-2",
      query: "Analyze my portfolio risk and factor exposure across tech holdings",
      category: "Risk & Portfolio",
      date: "Sep 22, 2026 • 11:30",
      status: "Completed",
      agentsUsed: ["portfolio", "risk", "investment"],
      consensusVerdict: "Tech Overweight (31.6%) Requires Rebalancing",
      consensusScore: 94,
      findings: [
        "TCS and NVIDIA comprise 31.6% of portfolio NAV.",
        "Active beta is 0.88 with 95% 1-day VaR of ₹1.42L.",
      ],
      actions: [
        "Direct next systematic cash inflow toward Sovereign G-Sec 2034.",
      ],
    },
    {
      id: "ah-3",
      query: "US-China semiconductor export restrictions impact on tier-1 tech suppliers",
      category: "Geopolitical",
      date: "Sep 20, 2026 • 16:45",
      status: "Completed",
      agentsUsed: ["macro", "risk", "news", "trading"],
      consensusVerdict: "Neutral Short-Term Impact with Long-Term Capex Stability",
      consensusScore: 86,
      findings: [
        "Cloud hyperscaler capex commitments exceed $200B through 2027.",
        "Foundry capacity outside restricted regions is ramping steadily.",
      ],
      actions: [
        "Hold semiconductor equity positions with disciplined trailing stops.",
      ],
    },
    {
      id: "ah-4",
      query: "Q3 capital gains realization and Section 112A tax-loss harvesting",
      category: "Tax Optimization",
      date: "Sep 18, 2026 • 09:20",
      status: "Completed",
      agentsUsed: ["tax", "portfolio"],
      consensusVerdict: "₹62,400 Harvestable Loss Window Identified",
      consensusScore: 96,
      findings: [
        "Short-term capital gains can be offset against mid-cap equity lots.",
        "Section 94 compliance verified against wash-sale restrictions.",
      ],
      actions: [
        "Liquidate selected lots before quarter-end to harvest ₹12,480 in tax savings.",
      ],
    },
  ];

  const filtered = historyRecords.filter((h) =>
    h.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell
      headerTitle="Analysis History"
      headerSubtitle="Audit trail of multi-agent collaborative financial inquiries and decision trees"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Historical Collaborative Runs
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every query is cryptographically indexed with contributing agents and consensus scores
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 sm:w-64"
              />
            </div>

            <Link
              href="/ask"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">User Query / Objective</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Agents Activated</th>
                  <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition group"
                  >
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        &ldquo;{record.query}&rdquo;
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {record.consensusVerdict}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {record.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {record.agentsUsed.map((aId) => {
                          const ag = ALL_AGENTS.find((a) => a.id === aId);
                          return (
                            <span
                              key={aId}
                              className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {ag?.shortName || aId}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {record.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{record.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedAnalysis(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Analysis</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Analysis Detail Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  {selectedAnalysis.category}
                </span>
                <span className="text-xs text-slate-400">{selectedAnalysis.date}</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedAnalysis.consensusScore}% Consensus
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  &ldquo;{selectedAnalysis.query}&rdquo;
                </h3>
                <div className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                  Synthesis: {selectedAnalysis.consensusVerdict}
                </div>
              </div>

              {/* Participating Agents */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Participating Autonomous Agents:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAnalysis.agentsUsed.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Findings */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Reconciled Findings:
                </span>
                <div className="space-y-1.5">
                  {selectedAnalysis.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  Strategic Next Actions:
                </span>
                <div className="space-y-1.5">
                  {selectedAnalysis.actions.map((act, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified against FinOS GraphRAG memory</span>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
