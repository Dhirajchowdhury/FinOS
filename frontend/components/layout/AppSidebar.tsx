"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    <aside
      className={`h-full bg-[#080d1a] border-r border-slate-800/80 text-slate-300 flex flex-col justify-between select-none transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Top Header: Logo + Toggle */}
      <div>
        <div
          className={`h-16 flex items-center border-b border-slate-800/70 transition-all duration-300 ${
            isCollapsed ? "px-2 justify-center flex-col gap-1 py-1" : "px-4 justify-between"
          }`}
        >
          {/* Logo & Brand */}
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 shrink-0"
            title="FinOS Financial Operating System"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-4 h-4"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12h18M3 6h18M3 18h12"
                />
              </svg>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  Fin<span className="text-emerald-400">OS</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5 truncate">
                  FINANCIAL INTELLIGENCE OS
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && !isCollapsed && (
            <button
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="hidden lg:flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Collapse sidebar (Ctrl + B)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Quick Action Rail Toggle */}
        {isCollapsed && onToggleCollapse && (
          <div className="hidden lg:flex justify-center pt-2 pb-1 border-b border-slate-800/40">
            <button
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-all duration-200 cursor-pointer group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Expand sidebar (Ctrl + B)"
            >
              <PanelLeftOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-[#0f172a] text-white text-xs font-semibold shadow-2xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 flex items-center gap-1.5">
                <span>Expand Sidebar</span>
                <kbd className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400">Ctrl+B</kbd>
              </div>
            </button>
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="px-2.5 py-3 space-y-1" aria-label="Platform Core">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-opacity duration-200">
              Platform Core
            </div>
          )}
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isCollapsed
                      ? "justify-center min-h-[44px] min-w-[44px] h-11 w-11 mx-auto"
                      : "justify-between px-3 py-2.5 min-h-[40px]"
                  } ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        active
                          ? "text-emerald-400 scale-105"
                          : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Collapsed Hover Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-[#0f172a] text-white text-xs font-semibold shadow-2xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Section Separator */}
        <div className="px-3 my-1">
          <div className="h-px bg-slate-800/80" />
        </div>

        {/* Secondary Navigation */}
        <nav className="px-2.5 py-2 space-y-1" aria-label="Intelligence and Tools">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-opacity duration-200">
              Intelligence &amp; Tools
            </div>
          )}
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
            return (
              <div
                key={item.href}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center rounded-xl text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isCollapsed
                      ? "justify-center min-h-[44px] min-w-[44px] h-11 w-11 mx-auto"
                      : "justify-between px-3 py-2.5 min-h-[40px]"
                  } ${
                    active
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        active
                          ? "text-emerald-400 scale-105"
                          : "text-slate-400 group-hover:text-slate-200 group-hover:scale-105"
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>

                {/* Collapsed Hover Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-xl bg-[#0f172a] text-white text-xs font-semibold shadow-2xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150">
                    <span>{item.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-[#060a14]">
        {isCollapsed ? (
          <div className="relative group flex justify-center py-1">
            <Link
              href="/settings"
              onClick={onCloseMobile}
              className="min-h-[44px] min-w-[44px] h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:ring-2 hover:ring-emerald-400/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={`User profile: ${userName}`}
            >
              {userInitials}
            </Link>

            {/* Profile Tooltip on Collapsed */}
            <div className="absolute left-full bottom-2 ml-3 p-3 rounded-2xl bg-[#0f172a] text-white text-xs font-semibold shadow-2xl border border-slate-700/80 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 space-y-1">
              <div className="font-bold text-white">{userName}</div>
              <div className="text-[10px] text-slate-400 font-normal">{userEmail}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors">
            <Link
              href="/settings"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 truncate flex-1 min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-0.5"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {userInitials}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate leading-snug group-hover:text-emerald-400 transition-colors">
                  {userName}
                </span>
                <span className="text-[10px] text-slate-400 truncate leading-none">
                  {userEmail}
                </span>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Sign out of FinOS"
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
