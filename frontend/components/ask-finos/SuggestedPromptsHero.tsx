"use client";

import React from "react";
import {
  ShieldAlert,
  Newspaper,
  TrendingUp,
  Globe,
  Receipt,
  ShieldCheck,
  CreditCard,
  FileText,
  Sparkles,
  ArrowUpRight,
  Bot,
} from "lucide-react";

interface SuggestedPromptsHeroProps {
  onSelectPrompt: (promptText: string) => void;
}

export function SuggestedPromptsHero({ onSelectPrompt }: SuggestedPromptsHeroProps) {
  const suggestions = [
    {
      title: "Analyze my portfolio risk",
      desc: "Stress test against 15% rate shocks & sector concentration",
      icon: ShieldAlert,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    },
    {
      title: "What is happening in the market today?",
      desc: "Sub-second news & regulatory sentiment scan",
      icon: Newspaper,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    {
      title: "Should I rebalance my portfolio?",
      desc: "Alpha opportunities & tactical asset allocation",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Explain the impact of RBI rate changes",
      desc: "Central bank repo path & yield curve transmission",
      icon: Globe,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    },
    {
      title: "Find possible tax-saving opportunities",
      desc: "Identify STCG tax-loss harvesting candidates under Sec 112A",
      icon: Receipt,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    {
      title: "Detect suspicious transactions",
      desc: "Wire verification & graph anomaly scoring",
      icon: ShieldCheck,
      color: "text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
    {
      title: "Analyze my credit profile",
      desc: "Synthetic corporate rating & DSCR coverage stress test",
      icon: CreditCard,
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
    },
    {
      title: "Generate a portfolio report",
      desc: "Board-ready executive tear-sheet & multi-agent memo",
      icon: FileText,
      color: "text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
    },
  ];

  return (
    <div className="text-center py-6 sm:py-10 space-y-6 max-w-4xl mx-auto px-2">
      {/* Brand Hero Heading */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>FinOS Financial Intelligence Engine</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          How can I help you today?
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Ask any question about your portfolio, markets, taxes, or risk. FinOS automatically orchestrates and routes your request across 10 specialized financial agents.
        </p>
      </div>

      {/* Suggested Prompts Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left pt-2">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.title)}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`p-2 rounded-xl border ${item.color} transition-transform group-hover:scale-105`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {item.title}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
                  {item.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Run Prompt →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
