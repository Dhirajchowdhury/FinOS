"use client";

import React from "react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { ArrowRight, TrendingUp, ShieldCheck, PieChart } from "lucide-react";

export function CompactPortfolioCard() {
  const chartData = [
    { day: "1", value: 1210000 },
    { day: "5", value: 1218000 },
    { day: "10", value: 1225000 },
    { day: "15", value: 1220000 },
    { day: "20", value: 1238000 },
    { day: "25", value: 1235000 },
    { day: "30", value: 1245000 },
  ];

  return (
    <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Overview</h3>
              <p className="text-[11px] text-slate-400">Multi-asset NAV &amp; factor exposure</p>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            Real-Time NAV
          </span>
        </div>

        {/* Primary Metrics */}
        <div className="space-y-1 mb-4">
          <div className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">
            Total Value
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white font-mono">
              ₹12,45,000
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+₹18,420 (+1.48%)</span>
            </div>
          </div>
        </div>

        {/* Mini Recharts Performance Curve */}
        <div className="h-24 w-full my-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow">
                        ₹{(payload[0].value as number).toLocaleString("en-IN")}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#miniChartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Risk Level</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Moderate</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Holdings</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">8 Assets</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Top Sector</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">Technology</div>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/portfolio"
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
        >
          <span>View Portfolio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
