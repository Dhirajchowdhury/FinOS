"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MOCK_PERFORMANCE_HISTORY } from "@/lib/mock/portfolio";

export function PerformanceChart() {
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "1Y" | "ALL">("1M");
  const data = MOCK_PERFORMANCE_HISTORY[timeframe] || MOCK_PERFORMANCE_HISTORY["1M"];

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Performance Attribution & NAV History
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Normalized net-asset value progression relative to composite benchmark
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          {(["1M", "3M", "1Y", "ALL"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`relative px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                timeframe === tf
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {timeframe === tf && (
                <motion.div
                  layoutId="activePerformanceTimeframe"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs -z-0"
                />
              )}
              <span className="relative z-10">{tf}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex items-center gap-6 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-slate-600 dark:text-slate-400">FinOS Portfolio (Active)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-slate-400 dark:bg-slate-600" />
          <span className="text-slate-600 dark:text-slate-400">Blended Benchmark</span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              className="dark:opacity-10"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
              domain={["dataMin - 100000", "dataMax + 100000"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1.5">{label}</div>
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                          <span>Portfolio:</span>
                          <span className="font-bold">{formatCurrency(payload[0]?.value as number)}</span>
                        </div>
                        {payload[1] && (
                          <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
                            <span>Benchmark:</span>
                            <span>{formatCurrency(payload[1]?.value as number)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="portfolio"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#navGradient)"
              activeDot={{ r: 5, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
