"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarketNewsItem } from "@/types/market";
import { Newspaper, ArrowUpRight, Bot, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface NewsFeedProps {
  news: MarketNewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
  const [filterSentiment, setFilterSentiment] = useState<string>("All");

  if (!news || news.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs text-center space-y-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">AI-Curated Intelligence Stream</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Market news feed unavailable. Live news stream is offline.
        </p>
      </div>
    );
  }

  const filteredNews = news.filter((item) => {
    if (filterSentiment === "All") return true;
    return item.sentiment === filterSentiment;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI-Curated Intelligence Stream</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesized by FinOS News Agent with sentiment &amp; market impact ratings
            </p>
          </div>
        </div>

        {/* Sentiment Filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
          {(["All", "Positive", "Negative", "Neutral"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSentiment(s)}
              className={`relative px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                filterSentiment === s
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {filterSentiment === s && (
                <motion.div
                  layoutId="activeSentimentFilter"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-md shadow-xs -z-0"
                />
              )}
              <span className="relative z-10">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <AnimatePresence mode="popLayout">
          {filteredNews.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="py-4 first:pt-1 last:pb-1 group"
            >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.sentiment === "Positive"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : item.sentiment === "Negative"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {item.sentiment} ({item.sentimentScore}%)
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.source} • {item.timeAgo}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.summary}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Impacted:</span>
                  {item.relatedTickers.map((sym) => (
                    <span
                      key={sym}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {sym}
                    </span>
                  ))}
                  {item.relevanceToPortfolio && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      In Portfolio
                    </span>
                  )}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
