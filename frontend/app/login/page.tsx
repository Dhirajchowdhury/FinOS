"use client";

import React, { useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShieldCheck,
  Activity,
  Lock,
  Globe,
  ChevronDown,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  // If already authenticated, forward directly to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const features = [
    {
      icon: TrendingUp,
      title: "Automated Portfolio Analytics",
      description: "Get deeper predictive insights with AI algorithms",
    },
    {
      icon: ShieldCheck,
      title: "AI Risk Guardrails",
      description: "Detect anomalies and prevent exposure early",
    },
    {
      icon: Activity,
      title: "Real-Time Market Feeds",
      description: "Stay ahead with sub-second institutional data",
    },
    {
      icon: Lock,
      title: "Institution-Grade Security",
      description: "Your financial assets stay private and encrypted",
    },
  ];

  return (
    <main className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden w-full flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-[#080c14] transition-colors duration-300">
      {/* ================= LEFT COLUMN: HERO SHOWCASE (50% width - Expanded Image) ================= */}
      <div className="relative w-full lg:w-[50%] lg:h-full min-h-[500px] flex flex-col justify-between p-6 sm:p-8 lg:p-7 xl:p-9 text-white bg-slate-950 overflow-hidden shrink-0">
        {/* Background Image - clearly visible with true colors and pleasant opacity */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        {/* Smooth photographic vignette: darker behind text, transparent toward center/right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 pointer-events-none" />

        {/* Top Header inside Left Hero */}
        <header className="relative z-10 flex items-center justify-between">
          {/* FinOS Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 p-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white leading-none">
                Fin<span className="text-emerald-400">OS</span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-[0.25em] uppercase mt-0.5">
                FINANCIAL OPERATING SYSTEM
              </span>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>AI Platform</span>
          </div>
        </header>

        {/* Center Content: Headline & 4 Feature Pillars */}
        <div className="relative z-10 my-auto py-2 max-w-lg">
          {/* Breadcrumb / Tagline */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase mb-2">
            <span>DATA</span>
            <span className="text-emerald-400 font-extrabold">×</span>
            <span>INTELLIGENCE</span>
            <span className="text-emerald-400 font-extrabold">×</span>
            <span>IMPACT</span>
          </div>

          {/* Main Title - Proportional */}
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] xl:text-[34px] font-black tracking-tight text-white leading-[1.15] mb-2">
            Turn Financial <br />
            Data into <br />
            <span className="text-emerald-400 drop-shadow-[0_2px_12px_rgba(52,211,153,0.3)]">
              Smarter Decisions
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed mb-3.5 max-w-md">
            FinOS is an AI-powered financial operating system designed to help
            institutions and individuals make faster, smarter and more confident
            decisions.
          </p>

          {/* Feature List with Compact High-Contrast Glass Badges */}
          <div className="space-y-2">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm backdrop-blur-sm hover:border-emerald-500/40 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-normal">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal leading-tight">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Quote & FinOS Signature */}
        <div className="relative z-10 pt-2 border-t border-slate-800/80">
          <p className="text-xs italic text-slate-300 font-normal">
            &ldquo;Empowering better financial decisions for a stronger tomorrow.&rdquo;
          </p>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            FinOS Institutional Core
          </span>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: LOGIN FORM PANEL (50% width - Shifted Right) ================= */}
      <div className="flex-1 w-full lg:w-[50%] lg:h-full flex flex-col justify-between p-5 sm:p-7 lg:py-5 lg:px-8 xl:px-14 bg-[#f8fafc] dark:bg-[#080c14] border-l border-slate-200/70 dark:border-slate-800/80 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.08)] dark:shadow-none transition-colors duration-300">
        {/* Top bar: Language & Theme Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-5 max-w-[465px] w-full mx-auto lg:mr-0 lg:max-w-none">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition">
            <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>English</span>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 scale-100" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 transition-transform rotate-0 scale-100" />
            )}
          </button>
        </div>

        {/* Center: Auth Card - Perfectly proportioned */}
        <div className="my-auto py-1 flex items-center justify-center">
          <LoginForm />
        </div>

        {/* Bottom Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80 max-w-[465px] w-full mx-auto transition-colors">
          <div>
            &copy; {new Date().getFullYear()} FinOS Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-slate-800 dark:hover:text-slate-200 transition">
              Privacy
            </a>
            <a href="#terms" className="hover:text-slate-800 dark:hover:text-slate-200 transition">
              Terms
            </a>
            <a href="#support" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition">
              Support
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
