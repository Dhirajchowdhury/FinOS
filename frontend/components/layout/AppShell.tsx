"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { PageTransition } from "@/components/motion/PageTransition";

interface AppShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
}

export function AppShell({ children, headerTitle, headerSubtitle }: AppShellProps) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load persisted sidebar state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("finos-sidebar-collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch (e) {
      // safe fallback
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("finos-sidebar-collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  // Global Ctrl+K (search) & Ctrl+B (toggle sidebar) shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notifications = [
    {
      id: "n-1",
      title: "Consensus Signal: RBI Rate Stability",
      time: "10m ago",
      desc: "Macro & Risk agents projected duration resilience.",
      unread: true,
      icon: Activity,
    },
    {
      id: "n-2",
      title: "Payslip Parsed Successfully",
      time: "45m ago",
      desc: "August 2026 salary slip analysis generated.",
      unread: true,
      icon: FileText,
    },
    {
      id: "n-3",
      title: "Portfolio NAV Reconciled",
      time: "2h ago",
      desc: "Daily NAV updated to ₹12.45L (+1.48%).",
      unread: false,
      icon: CheckCircle2,
    },
    {
      id: "n-4",
      title: "Tax-Loss Harvesting Opportunity",
      time: "4h ago",
      desc: "Tax Agent identified ₹62.4k in eligible lots.",
      unread: false,
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* Desktop Sidebar (Collapsible 256px <-> 72px) */}
      <div
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isSidebarCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 h-full animate-in slide-in-from-left duration-200">
            <AppSidebar
              isCollapsed={false}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white/90 dark:bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Page Context */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            {headerTitle ? (
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {headerTitle}
                </h1>
                {headerSubtitle && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                    {headerSubtitle}
                  </p>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  All Systems Operational
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  10/10 Agents Online
                </span>
              </div>
            )}
          </div>

          {/* Right: Search, Notifications, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Search anything...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                Ctrl + K
              </kbd>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsProfileMenuOpen(false);
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Notifications &amp; Alerts
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      2 New
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto mt-2">
                    {notifications.map((n) => {
                      const Icon = n.icon;
                      return (
                        <div key={n.id} className="py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-lg transition">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Close Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {(user?.name || "Anuj")[0].toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      {user?.name || "Anuj Kumar Singh"}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user?.email || "anuj.singh@finos.ai"}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Workspace Settings</span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Global Command Search Overlay */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
