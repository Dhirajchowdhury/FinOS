"use client";

import React from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Activity, Globe } from "lucide-react";
import { MOCK_INDICES } from "@/lib/mock/market";

export function CompactMarketCard() {
  // Focus on the 4 requested assets: NIFTY 50, SENSEX, USD/INR, Gold
  const targetSymbols = ["NIFTY 50", "SENSEX", "USD/INR", "Gold (10g)"];
  const displayIndices = MOCK_INDICES.filter((idx) =>
    targetSymbols.includes(idx.symbol)
  );

  return (
    <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Market Summary</h3>
              <p className="text-[11px] text-slate-400">Benchmark indices &amp; FX rates</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Open</span>
          </span>
        </div>

        {/* 4 Asset Tickers List */}
        <div className="space-y-2.5 my-2">
          {displayIndices.map((idx) => {
            const isPositive = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {idx.symbol}
                  </div>
                  <div className="text-[10px] text-slate-400">{idx.name}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {idx.value < 100
                      ? `₹${idx.value.toFixed(2)}`
                      : idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={`flex items-center justify-end gap-1 text-[11px] font-bold ${
                      isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {idx.changePercent}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/market"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
        >
          <span>View Markets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
