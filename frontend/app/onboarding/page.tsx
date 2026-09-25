"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Briefcase,
  Layers,
  Cpu,
  TrendingUp,
  BarChart,
  Lock,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [role, setRole] = useState("Portfolio Manager");
  const [markets, setMarkets] = useState<string[]>([
    "Indian Equities (NSE/BSE)",
    "US Equities (NYSE/NASDAQ)",
  ]);
  const [orchestrationMode, setOrchestrationMode] = useState("Autonomous Consensus");

  const roles = [
    { id: "pm", title: "Portfolio Manager", desc: "Multi-asset allocation, factor risk tracking, NAV attribution" },
    { id: "ro", title: "Chief Risk Officer", desc: "VaR stress testing, liquidity limits, anomaly detection" },
    { id: "qt", title: "Quantitative Trader", desc: "Algorithmic signals, execution speed, slippage minimization" },
    { id: "wa", title: "Wealth / Tax Advisor", desc: "Client portfolios, capital gains harvesting, compliance" },
    { id: "ii", title: "Active Private Treasury", desc: "Personal wealth optimization and automated guardrails" },
  ];

  const marketOptions = [
    "Indian Equities (NSE/BSE)",
    "US Equities (NYSE/NASDAQ)",
    "India Sovereign Debt & G-Sec",
    "Global Macro & Commodities",
    "Options & Derivatives",
    "Forex & Cross-Currency",
  ];

  const orchestrationModes = [
    {
      id: "Autonomous Consensus",
      title: "Autonomous Multi-Agent Consensus",
      desc: "All 10 agents run concurrent analyses and automatically synthesize decisions using weighted consensus algorithms.",
      recommended: true,
    },
    {
      id: "Advisory Mode",
      title: "Advisory with Human-in-the-Loop",
      desc: "Agents provide recommendations, detailed rationale, and sensitivity tests, requiring explicit approval for actions.",
      recommended: false,
    },
    {
      id: "Strict Guardrail Mode",
      title: "Strict Capital Preservation",
      desc: "Risk Agent has veto power over all other 9 agents. Prioritizes drawdown minimization over alpha.",
      recommended: false,
    },
  ];

  const toggleMarket = (m: string) => {
    if (markets.includes(m)) {
      if (markets.length > 1) {
        setMarkets(markets.filter((item) => item !== m));
      }
    } else {
      setMarkets([...markets, m]);
    }
  };

  const handleFinish = () => {
    // Save onboarding preferences to localStorage for session persistence
    try {
      localStorage.setItem("finos_onboarding_completed", "true");
      localStorage.setItem("finos_user_role", role);
      localStorage.setItem("finos_user_markets", JSON.stringify(markets));
      localStorage.setItem("finos_orchestration_mode", orchestrationMode);
    } catch {
      // Ignore if localStorage unavailable
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Branding */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
            F
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
            Fin<span className="text-emerald-500">OS</span>
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">Setup Wizard • Step {step} of 3</div>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-2xl w-full mx-auto my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-9 shadow-lg">
        {/* Step Indicator Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* STEP 1: ROLE */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                Select Your Institutional Focus
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                FinOS tailors agent priority and risk sensitivity to your daily operational responsibilities.
              </p>
            </div>

            <div className="space-y-2.5">
              {roles.map((r) => {
                const isSelected = role === r.title;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.title)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: MARKETS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                Select Asset Classes & Markets
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your selected markets will be continuously ingested by News, Macro, and Trading agents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {marketOptions.map((m) => {
                const isSelected = markets.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarket(m)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{m}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: ORCHESTRATION MODE */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                Choose AI Orchestration Governance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Configure how the 10 agents resolve disputes and deliver synthesized insights.
              </p>
            </div>

            <div className="space-y-3">
              {orchestrationModes.map((om) => {
                const isSelected = orchestrationMode === om.id;
                return (
                  <button
                    key={om.id}
                    type="button"
                    onClick={() => setOrchestrationMode(om.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{om.title}</span>
                        {om.recommended && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500 text-white">
                            Recommended
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {om.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all"
            >
              <span>Launch Command Center</span>
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-slate-400">
        You can reconfigure these preferences at any time in Workspace Settings.
      </div>
    </div>
  );
}
