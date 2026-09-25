"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Receipt,
  FileText,
  PieChart,
  TrendingUp,
  Cpu,
  ArrowRight,
} from "lucide-react";

export function DashboardQuickActions() {
  const actions = [
    {
      label: "Ask FinOS",
      desc: "Natural language queries",
      icon: Sparkles,
      href: "/ask",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
    },
    {
      label: "Upload Payslip",
      desc: "Analyze deductions & tax",
      icon: Receipt,
      href: "/payslip",
      accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40",
    },
    {
      label: "New Report",
      desc: "Generate financial dossier",
      icon: FileText,
      href: "/reports",
      accent: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40",
    },
    {
      label: "Analyze Portfolio",
      desc: "NAV & factor breakdown",
      icon: PieChart,
      href: "/portfolio",
      accent: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40",
    },
    {
      label: "Market Overview",
      desc: "Indices, sectors & news",
      icon: TrendingUp,
      href: "/market",
      accent: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
    },
    {
      label: "Explore Agents",
      desc: "10 specialized AI models",
      icon: Cpu,
      href: "/agents",
      accent: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">6 Instant Workflows</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              href={act.href}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-xl border ${act.accent} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {act.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {act.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
