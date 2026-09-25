"use client";

import React, { ReactNode } from "react";
import { ShieldCheck, Users, Lock } from "lucide-react";

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="w-full max-w-[465px] mx-auto">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-200/90 dark:shadow-black/70 border border-slate-200/80 dark:border-slate-800 transition-all duration-300">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h2 className="text-[28px] sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Card Body */}
        {children}

        {/* Security & compliance footer badges */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Secure & Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Trusted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
