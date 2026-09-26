"use client";

import React, { useState, FormEvent } from "react";
import { Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface EmailLoginProps {
  onCodeSent: (email: string, cooldownSeconds?: number) => void;
  disabled?: boolean;
}

export function EmailLogin({ onCodeSent, disabled }: EmailLoginProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMessage("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await api.requestEmailCode(cleanEmail);
      onCodeSent(cleanEmail, response.cooldown_seconds ?? 60);
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to send verification code. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor="email-input"
          className="block text-sm font-bold text-slate-700 dark:text-slate-200 tracking-normal mb-2"
        >
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Mail className="h-5 w-5" />
          </div>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="name@company.com"
            disabled={disabled || isLoading}
            autoComplete="email"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700/80 text-base text-slate-900 dark:text-white bg-white dark:bg-slate-950/80 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition disabled:opacity-50"
            required
          />
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || isLoading || !email.trim()}
        className="w-full bg-[#047857] hover:bg-[#065f46] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 px-5 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 hover:shadow-lg transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span>Sending verification code...</span>
          </>
        ) : (
          <>
            <span>Continue with Email</span>
            <ArrowRight className="w-5 h-5 text-emerald-100" />
          </>
        )}
      </button>
    </form>
  );
}
