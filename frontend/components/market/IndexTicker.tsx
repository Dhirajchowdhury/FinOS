"use client";

import React from "react";
import { motion } from "framer-motion";
import { MarketIndex } from "@/types/market";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { TrendingUp, TrendingDown } from "lucide-react";

interface IndexTickerProps {
  indices: MarketIndex[];
}

export function IndexTicker({ indices }: IndexTickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {indices.map((idx, index) => {
        const isPositive = idx.change >= 0;
        const minVal = Math.min(...idx.sparkline);
        const maxVal = Math.max(...idx.sparkline);
        const range = maxVal - minVal || 1;
        const width = 100;
        const height = 28;
        const points = idx.sparkline
          .map((v, i) => {
            const x = (i / (idx.sparkline.length - 1)) * width;
            const y = height - ((v - minVal) / range) * (height - 6) - 3;
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <motion.div
            key={idx.symbol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between cursor-default"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    {idx.symbol}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {idx.region}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                  {idx.name}
                </div>
              </div>

              {/* Sparkline mini chart */}
              <div className="w-20 h-7 shrink-0">
                <svg viewBox="0 0 100 28" className="w-full h-full overflow-visible">
                  <motion.polyline
                    initial={{ pathLength: 0, opacity: 0.4 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                    fill="none"
                    stroke={isPositive ? "#10b981" : "#ef4444"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                <AnimatedNumber value={idx.value} decimals={2} durationMs={800} />
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-bold font-mono ${
                  isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>
                  {isPositive ? "+" : ""}
                  {idx.changePercent}%
                </span>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>52W L: {idx.low52.toLocaleString()}</span>
              <span>52W H: {idx.high52.toLocaleString()}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
