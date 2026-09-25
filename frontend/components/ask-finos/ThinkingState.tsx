"use client";

import React, { useState, useEffect } from "react";
import { Bot, Loader2, CheckCircle2, Circle } from "lucide-react";

export function ThinkingState() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Understanding query & intent",
    "Selecting relevant specialized agents",
    "Running multi-agent analysis & cross-verification",
    "Reconciling findings & consensus score",
    "Preparing final executive analysis",
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 400);
    const timer2 = setTimeout(() => setCurrentStep(2), 900);
    const timer3 = setTimeout(() => setCurrentStep(3), 1400);
    const timer4 = setTimeout(() => setCurrentStep(4), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="flex items-start gap-3 my-2 animate-in fade-in">
      {/* Bot Avatar */}
      <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-md shadow-emerald-600/20">
        <Bot className="w-4 h-4" />
      </div>

      <div className="p-4 rounded-3xl rounded-tl-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5 max-w-md w-full shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
          <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            FinOS is analyzing...
          </span>
        </div>

        <div className="space-y-1.5">
          {steps.map((stepText, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  isCompleted
                    ? "text-emerald-700 dark:text-emerald-400 font-medium"
                    : isCurrent
                    ? "text-slate-900 dark:text-white font-bold"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                )}
                <span>{stepText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
