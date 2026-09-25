import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Activity, Sparkles } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
              F
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-900 dark:text-white font-bold">FinOS</strong> — Financial Operating System. Multi-Agent AI Architecture.
            </span>
          </div>

          {/* Compliance & Security Trust Badges */}
          <div className="flex items-center gap-5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>10 Agents Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>HttpOnly Session Enclave</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition">
              Terms
            </Link>
            <Link href="/settings" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              System Settings
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400">
          <span>&copy; {new Date().getFullYear()} FinOS Intelligence Inc. All institutional rights reserved.</span>
          <span className="mt-1 sm:mt-0 font-mono">FastAPI Core • Next.js App Router • GraphRAG Engine</span>
        </div>
      </div>
    </footer>
  );
}
