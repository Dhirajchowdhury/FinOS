"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import {
  Mail,
  Lock,
  User as UserIcon,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Activity,
  Globe,
  ChevronDown,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

export default function SignupPage() {
  const { user, isLoading: isAuthLoading, checkSession } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forward authenticated users to dashboard
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.register(name, email, password);
      await checkSession();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* ================= LEFT COLUMN: HERO SHOWCASE ================= */}
      <div className="relative w-full lg:w-[50%] lg:h-full min-h-[500px] flex flex-col justify-between p-6 sm:p-8 lg:p-7 xl:p-9 text-white bg-slate-950 overflow-hidden shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70 pointer-events-none"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 pointer-events-none" />

        <header className="relative z-10 flex items-center justify-between">
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

        <div className="relative z-10 my-auto py-2 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-bold tracking-[0.2em] text-slate-300 uppercase mb-2">
            <span>DATA</span>
            <span className="text-emerald-400 font-extrabold">×</span>
            <span>INTELLIGENCE</span>
            <span className="text-emerald-400 font-extrabold">×</span>
            <span>IMPACT</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[30px] xl:text-[34px] font-black tracking-tight text-white leading-[1.15] mb-2">
            Create Your FinOS <br />
            Account &amp; Unlock <br />
            <span className="text-emerald-400 drop-shadow-[0_2px_12px_rgba(52,211,153,0.3)]">
              Institutional Intelligence
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed mb-3.5 max-w-md">
            Join thousands of analysts, traders, and investors making smarter, faster decisions with FinOS AI.
          </p>

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

        <div className="relative z-10 pt-2 border-t border-slate-800/80">
          <p className="text-xs italic text-slate-300 font-normal">
            &ldquo;Empowering better financial decisions for a stronger tomorrow.&rdquo;
          </p>
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            FinOS Institutional Core
          </span>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: SIGNUP FORM ================= */}
      <div className="flex-1 w-full lg:w-[50%] lg:h-full flex flex-col justify-between p-5 sm:p-7 lg:py-5 lg:px-8 xl:px-14 bg-[#f8fafc] dark:bg-[#080c14] border-l border-slate-200/70 dark:border-slate-800/80 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.08)] dark:shadow-none transition-colors duration-300">
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
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>

        <div className="my-auto py-1 flex items-center justify-center">
          <AuthCard
            title="Create Account"
            subtitle="Get started with FinOS institutional financial intelligence."
          >
            <div className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@finos.io"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-[#0f172a] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  or sign up with
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              </div>

              <GoogleLoginButton />

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </AuthCard>
        </div>

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
