"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Bot, TrendingUp, FileText, ArrowRight, Shield } from "lucide-react";
import { MOCK_AGENTS } from "@/lib/mock/agents";
import { MOCK_HOLDINGS } from "@/lib/mock/portfolio";
import { MOCK_REPORTS } from "@/lib/mock/reports";
import { MOCK_ANALYSIS_RECORDS } from "@/lib/mock/analysis";
import { History } from "lucide-react";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  // Filter Agents
  const matchedAgents = MOCK_AGENTS.filter(
    (a) =>
      !cleanQuery ||
      a.name.toLowerCase().includes(cleanQuery) ||
      a.shortDescription.toLowerCase().includes(cleanQuery) ||
      a.tags.some((t) => t.toLowerCase().includes(cleanQuery))
  ).slice(0, 4);

  // Filter Holdings
  const matchedHoldings = MOCK_HOLDINGS.filter(
    (h) =>
      !cleanQuery ||
      h.symbol.toLowerCase().includes(cleanQuery) ||
      h.name.toLowerCase().includes(cleanQuery) ||
      h.assetClass.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  // Filter Reports
  const matchedReports = MOCK_REPORTS.filter(
    (r) =>
      !cleanQuery ||
      r.title.toLowerCase().includes(cleanQuery) ||
      r.type.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  // Filter Analyses
  const matchedAnalyses = MOCK_ANALYSIS_RECORDS.filter(
    (a) =>
      !cleanQuery ||
      a.title.toLowerCase().includes(cleanQuery) ||
      a.query.toLowerCase().includes(cleanQuery) ||
      a.type.toLowerCase().includes(cleanQuery)
  ).slice(0, 3);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            autoFocus
            className="flex-1 bg-transparent text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          {!cleanQuery && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  onClick={() => handleSelect("/analysis/multi-agent")}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Multi-Agent Pipeline
                    </div>
                    <div className="text-[10px] text-slate-400">Cross-agent consensus engine</div>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect("/portfolio")}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-left transition border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Portfolio Attribution
                    </div>
                    <div className="text-[10px] text-slate-400">NAV & asset allocation</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* AI Agents Results */}
          {matchedAgents.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                AI Agents ({matchedAgents.length})
              </span>
              <div className="space-y-1 mt-1.5">
                {matchedAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(`/agents/${agent.slug}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text}`}>
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {agent.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {agent.shortDescription}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Holdings Results */}
          {matchedHoldings.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Portfolio Holdings ({matchedHoldings.length})
              </span>
              <div className="space-y-1 mt-1.5">
                {matchedHoldings.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleSelect("/portfolio")}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {h.symbol}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        {h.name}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{h.totalValue.toLocaleString("en-IN")}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reports Results */}
          {matchedReports.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Financial Reports ({matchedReports.length})
              </span>
              <div className="space-y-1 mt-1.5">
                {matchedReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect("/reports")}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {r.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{r.generatedDate}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Analysis History Results */}
          {matchedAnalyses.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Analysis History ({matchedAnalyses.length})
              </span>
              <div className="space-y-1 mt-1.5">
                {matchedAnalyses.map((an) => (
                  <button
                    key={an.id}
                    onClick={() => handleSelect(`/analysis/${an.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 text-left transition"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <History className="w-4 h-4 text-purple-500 shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {an.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {an.query}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{an.date}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
          <span>Navigate with arrows • Press ESC to exit</span>
          <span className="font-mono">FinOS Intelligence Core</span>
        </div>
      </div>
    </div>
  );
}
