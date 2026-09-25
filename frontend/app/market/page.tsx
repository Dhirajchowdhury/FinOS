"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { IndexTicker } from "@/components/market/IndexTicker";
import { SectorHeatmap } from "@/components/market/SectorHeatmap";
import { NewsFeed } from "@/components/market/NewsFeed";
import { MOCK_INDICES, MOCK_SECTORS, MOCK_NEWS, MOCK_WATCHLIST } from "@/lib/mock/market";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Globe,
  Bot,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function MarketPage() {
  const [watchlist, setWatchlist] = useState(MOCK_WATCHLIST);
  const [watchlistSearch, setWatchlistSearch] = useState("");

  const filteredWatchlist = watchlist.filter((item) =>
    item.symbol.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
    item.name.toLowerCase().includes(watchlistSearch.toLowerCase())
  );

  return (
    <AppShell
      headerTitle="Market Summary"
      headerSubtitle="Real-time multi-asset indices, sector momentum, and AI-curated news stream"
    >
      <div className="space-y-6">
        {/* Market Banner */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Institutional Telemetry
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-mono">Real-Time Tick Pipeline</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Global &amp; Domestic Market Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Cross-asset data synthesized in real time by the Trading, Macro, and News agents with sentiment extraction and volume outlier detection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Exchanges Open (NSE / BSE)</span>
            </span>
          </div>
        </section>

        {/* Global Indices Tickers with Sparklines */}
        <IndexTicker indices={MOCK_INDICES} />

        {/* Two-Column Grid: Left (Sectors & Watchlist) / Right (News & Agent Advisory) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sectors & Watchlist (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <SectorHeatmap sectors={MOCK_SECTORS} />

            {/* Watchlist Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Watchlist</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    High-conviction liquid instruments monitored by Trading Agent
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ticker..."
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-40"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Symbol</th>
                      <th className="py-3 px-4 font-semibold text-right">Price</th>
                      <th className="py-3 px-4 font-semibold text-right">Change</th>
                      <th className="py-3 px-4 font-semibold text-right">Volume</th>
                      <th className="py-3 px-4 font-semibold text-center">AI Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredWatchlist.map((item) => {
                      const isPositive = item.change >= 0;
                      return (
                        <tr key={item.symbol} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white font-mono">{item.symbol}</div>
                            <div className="text-[11px] text-slate-400">{item.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{item.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                              {isPositive ? "+" : ""}{item.changePercent}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {item.volume}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.signal === "Buy"
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                  : item.signal === "Trim"
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {item.signal}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: AI News Feed & Commentary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <NewsFeed news={MOCK_NEWS} />

            {/* Trading Agent Tactical Note */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  Trading Agent Tactical Update
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                NIFTY 50 volume profile shows institutional absorption near 25,200 support. Options put-call ratio (PCR) at 1.14 reflects stable bullish bias across frontline financials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
