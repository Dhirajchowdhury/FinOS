"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  PieChart,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";

export function QuickActions() {
  const shouldReduceMotion = useReducedMotion();

  // Subtle 3D Card Tilt Component for Desktop
  const TiltCard = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !cardRef.current) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Max 1.8 deg tilt for institutional polish
      setRotateX(-y / 35);
      setRotateY(x / 35);
    };

    const handleMouseLeave = () => {
      setRotateX(0);
      setRotateY(0);
    };

    return (
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
          mass: 0.5,
        }}
        style={{ transformStyle: "preserve-3d" }}
        className={`h-full ${className}`}
      >
        {children}
      </motion.div>
    );
  };

  return (
    <section className="rounded-3xl sm:rounded-[32px] p-6 sm:p-8 bg-gradient-to-r from-emerald-50/40 via-white to-teal-50/40 dark:from-[#061812]/50 dark:via-[#0c1222] dark:to-[#091b1d]/50 border-2 border-teal-300/50 dark:border-teal-500/30 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Decorative ambient top-right glow */}
      <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-l from-teal-400/15 via-emerald-400/10 to-transparent blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          {/* Lightning Icon in Squircle Container */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="w-12 h-12 rounded-2xl bg-[#e6fcf5] dark:bg-emerald-950/70 border border-teal-300/70 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs"
          >
            <Zap className="w-5 h-5 fill-teal-500/30 text-teal-600 dark:text-teal-400" />
          </motion.div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Quick Actions
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50/80 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300/80 dark:border-teal-700/80 shadow-2xs">
                ESSENTIAL TOOLS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Your most used tools and features
            </p>
          </div>
        </div>

        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline self-start sm:self-center transition-all group"
        >
          <span>View All Tools</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 3 Prominent Balanced Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 relative z-10">
        {/* ========================================================================= */}
        {/* CARD 1: ASK FINOS (Mint / Green Theme) */}
        {/* ========================================================================= */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Link
              href="/ask"
              className="h-full p-6 sm:p-7 rounded-[24px] bg-gradient-to-b from-[#f0fdf4]/90 via-white to-[#f0fdf4]/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-950/10 border border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Top Row: Icon + Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                    <Sparkles className="w-5 h-5 fill-emerald-500/20" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100/60 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>AI POWERED</span>
                  </span>
                </div>

                {/* Content Area + Right Side Floating AI Visual */}
                <div className="relative min-h-[140px] flex justify-between items-start">
                  <div className="z-10 pr-2 max-w-[200px] sm:max-w-[220px]">
                    <h4 className="text-lg font-black text-slate-950 dark:text-white tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Ask FinOS
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      Natural language query
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                      Get instant answers about your portfolio, market trends, taxes, or upload your payslip.
                    </p>
                  </div>

                  {/* 3D Floating Glassmorphic AI Document Graphic */}
                  <div className="absolute right-0 top-1 w-28 h-28 pointer-events-none select-none opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300">
                    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
                      {/* Ambient Glow */}
                      <circle cx="60" cy="60" r="45" fill="url(#mintGlow)" opacity="0.4" />
                      
                      {/* Back Slanted Card Layer */}
                      <rect x="34" y="22" width="70" height="74" rx="14" fill="#a7f3d0" fillOpacity="0.45" stroke="#6ee7b7" strokeWidth="1.5" transform="rotate(8 34 22)" />
                      
                      {/* Front Glassmorphic Document Card */}
                      <rect x="22" y="26" width="74" height="68" rx="14" fill="white" fillOpacity="0.88" stroke="#34d399" strokeWidth="1.5" />
                      
                      {/* Document Lines */}
                      <rect x="34" y="38" width="34" height="4" rx="2" fill="#10b981" fillOpacity="0.75" />
                      <rect x="34" y="47" width="48" height="3" rx="1.5" fill="#6ee7b7" fillOpacity="0.75" />
                      <rect x="34" y="55" width="40" height="3" rx="1.5" fill="#6ee7b7" fillOpacity="0.6" />
                      <rect x="34" y="63" width="28" height="3" rx="1.5" fill="#a7f3d0" fillOpacity="0.7" />

                      {/* Floating AI Sparkle Badge */}
                      <circle cx="82" cy="74" r="13" fill="#10b981" />
                      <path d="M82 66L84 71L89 73L84 75L82 80L80 75L75 73L80 71L82 66Z" fill="white" />

                      <defs>
                        <radialGradient id="mintGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(45)">
                          <stop stopColor="#34d399" stopOpacity="0.6" />
                          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Rounded Primary CTA Button */}
              <div className="mt-5 pt-3">
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/25 group-hover:shadow-lg transition-all duration-200">
                  <span>Get instant insights</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        </TiltCard>

        {/* ========================================================================= */}
        {/* CARD 2: ANALYZE PORTFOLIO (Blue Theme) */}
        {/* ========================================================================= */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Link
              href="/portfolio"
              className="h-full p-6 sm:p-7 rounded-[24px] bg-gradient-to-b from-[#eff6ff]/90 via-white to-[#eff6ff]/40 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/10 border border-blue-200/90 dark:border-blue-800/70 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Top Row: Icon + Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                    <PieChart className="w-5 h-5 fill-blue-500/20" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100/60 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <span>PORTFOLIO INSIGHTS</span>
                  </span>
                </div>

                {/* Content Area + Right Side Floating Portfolio Analytics Visual */}
                <div className="relative min-h-[140px] flex justify-between items-start">
                  <div className="z-10 pr-2 max-w-[200px] sm:max-w-[220px]">
                    <h4 className="text-lg font-black text-slate-950 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Analyze Portfolio
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      NAV &amp; factor loadings
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                      Get detailed portfolio analysis, asset allocation, risk metrics and performance insights.
                    </p>
                  </div>

                  {/* 3D Floating Glassmorphic Portfolio Analytics Graphic */}
                  <div className="absolute right-0 top-1 w-28 h-28 pointer-events-none select-none opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300">
                    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
                      {/* Ambient Glow */}
                      <circle cx="60" cy="60" r="45" fill="url(#blueGlow)" opacity="0.4" />
                      
                      {/* Back Chart Panel Frame */}
                      <rect x="24" y="24" width="76" height="66" rx="14" fill="white" fillOpacity="0.85" stroke="#93c5fd" strokeWidth="1.5" />
                      
                      {/* Trend Line Curve */}
                      <path d="M34 66C44 60 52 50 62 54C72 58 78 40 88 36" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                      
                      {/* Chart Area Fill */}
                      <path d="M34 66C44 60 52 50 62 54C72 58 78 40 88 36V78H34V66Z" fill="url(#blueArea)" fillOpacity="0.3" />

                      {/* Analytics Metric Bars */}
                      <rect x="74" y="60" width="4" height="18" rx="2" fill="#3b82f6" fillOpacity="0.75" />
                      <rect x="81" y="52" width="4" height="26" rx="2" fill="#60a5fa" fillOpacity="0.85" />
                      <rect x="88" y="44" width="4" height="34" rx="2" fill="#2563eb" />

                      {/* 3D Floating Donut Ring Card */}
                      <g transform="translate(68, 62)">
                        <rect x="-4" y="-4" width="36" height="36" rx="10" fill="white" fillOpacity="0.95" stroke="#bfdbfe" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
                        <circle cx="14" cy="14" r="10" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="40 20" fill="none" transform="rotate(-45 14 14)" />
                        <circle cx="14" cy="14" r="10" stroke="#93c5fd" strokeWidth="4.5" strokeDasharray="18 45" strokeDashoffset="-40" fill="none" transform="rotate(-45 14 14)" />
                      </g>

                      <defs>
                        <radialGradient id="blueGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(45)">
                          <stop stopColor="#60a5fa" stopOpacity="0.6" />
                          <stop offset="1" stopColor="#60a5fa" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="blueArea" x1="61" y1="36" x2="61" y2="78" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#3b82f6" />
                          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Rounded Primary CTA Button */}
              <div className="mt-5 pt-3">
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-700/25 group-hover:shadow-lg transition-all duration-200">
                  <span>Risk analysis</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        </TiltCard>

        {/* ========================================================================= */}
        {/* CARD 3: MARKET SUMMARY (Purple Theme) */}
        {/* ========================================================================= */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Link
              href="/market"
              className="h-full p-6 sm:p-7 rounded-[24px] bg-gradient-to-b from-[#faf5ff]/90 via-white to-[#faf5ff]/40 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-950/10 border border-purple-200/90 dark:border-purple-800/70 hover:border-purple-400 dark:hover:border-purple-500 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              {/* Top Row: Icon + Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100/70 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-2xs">
                    <TrendingUp className="w-5 h-5 fill-purple-500/20" />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100/60 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                    <span>LIVE MARKET DATA</span>
                  </span>
                </div>

                {/* Content Area + Right Side Floating Market Summary Visual */}
                <div className="relative min-h-[140px] flex justify-between items-start">
                  <div className="z-10 pr-2 max-w-[200px] sm:max-w-[220px]">
                    <h4 className="text-lg font-black text-slate-950 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      Market Summary
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      NIFTY, S&amp;P &amp; latest news
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                      Get real-time market insights, key news events, sector trends and global market analysis.
                    </p>
                  </div>

                  {/* 3D Floating Glassmorphic Market Intelligence Graphic */}
                  <div className="absolute right-0 top-1 w-28 h-28 pointer-events-none select-none opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300">
                    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-md">
                      {/* Ambient Glow */}
                      <circle cx="60" cy="60" r="45" fill="url(#purpleGlow)" opacity="0.4" />
                      
                      {/* Back Ascending Chart Frame */}
                      <rect x="22" y="24" width="76" height="64" rx="14" fill="white" fillOpacity="0.85" stroke="#d8b4fe" strokeWidth="1.5" />
                      
                      {/* Market Breakout Curve */}
                      <path d="M30 68C42 62 48 56 60 48C70 42 76 34 88 28" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M30 68C42 62 48 56 60 48C70 42 76 34 88 28V76H30V68Z" fill="url(#purpleArea)" fillOpacity="0.3" />

                      {/* Floating News / Intelligence Card */}
                      <g transform="translate(62, 54)">
                        <rect x="0" y="0" width="46" height="36" rx="10" fill="white" fillOpacity="0.95" stroke="#e9d5ff" strokeWidth="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
                        
                        {/* Mini News Lines */}
                        <rect x="7" y="9" width="10" height="9" rx="2" fill="#a855f7" fillOpacity="0.85" />
                        <rect x="20" y="9" width="20" height="3" rx="1.5" fill="#c084fc" />
                        <rect x="20" y="15" width="16" height="2.5" rx="1.2" fill="#d8b4fe" />
                        <rect x="7" y="22" width="22" height="2.5" rx="1.2" fill="#e9d5ff" />
                        <rect x="7" y="27" width="14" height="2" rx="1" fill="#e9d5ff" />

                        {/* Tiny Globe / Feed Icon */}
                        <circle cx="34" cy="25" r="4.5" fill="#7c3aed" fillOpacity="0.15" stroke="#7c3aed" strokeWidth="1" />
                        <path d="M34 20.5V29.5M29.5 25H38.5" stroke="#7c3aed" strokeWidth="0.8" />
                      </g>

                      <defs>
                        <radialGradient id="purpleGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(45)">
                          <stop stopColor="#c084fc" stopOpacity="0.6" />
                          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="purpleArea" x1="59" y1="28" x2="59" y2="76" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#a855f7" />
                          <stop offset="1" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Rounded Primary CTA Button */}
              <div className="mt-5 pt-3">
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-700/25 group-hover:shadow-lg transition-all duration-200">
                  <span>Market insights</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        </TiltCard>
      </div>
    </section>
  );
}

// Re-export alias for backward compatibility
export { QuickActions as DashboardQuickActions };
