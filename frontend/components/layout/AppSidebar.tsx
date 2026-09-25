"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Sparkles,
  PieChart,
  FileText,
  TrendingUp,
  Receipt,
  Cpu,
  History,
  Eye,
  Settings,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface AppSidebarProps {
  onCloseMobile?: () => void;
}

export function AppSidebar({ onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mainNavigation = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Ask FinOS", href: "/ask", icon: Sparkles, badge: "AI Core" },
    { label: "Portfolio", href: "/portfolio", icon: PieChart },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Market Summary", href: "/market", icon: TrendingUp },
    { label: "Upload Payslip", href: "/payslip", icon: Receipt },
  ];

  const secondaryNavigation = [
    { label: "AI Agents", href: "/agents", icon: Cpu },
    { label: "Analysis History", href: "/analysis/history", icon: History },
    { label: "Watchlist", href: "/watchlist", icon: Eye },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const userName = user?.name || "Anuj Kumar Singh";
  const userEmail = user?.email || "anuj.singh@finos.ai";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 h-full bg-[#080d1a] border-r border-slate-800/80 text-slate-300 flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/70">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white leading-none">
                Fin<span className="text-emerald-400">OS</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                FINANCIAL INTELLIGENCE OS
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Core
          </div>
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="px-3 my-2">
          <div className="h-px bg-slate-800/80" />
        </div>

        {/* Secondary Navigation */}
        <div className="px-3 py-2 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Intelligence & Tools
          </div>
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#060a14]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitials}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate leading-snug">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 truncate leading-none">
                {userEmail}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign out of FinOS"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
