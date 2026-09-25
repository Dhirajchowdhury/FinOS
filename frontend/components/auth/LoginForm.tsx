"use client";

import React, { useState } from "react";
import { AuthCard } from "./AuthCard";
import { EmailLogin } from "./EmailLogin";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { OTPVerification } from "./OTPVerification";
import { AuthStep } from "@/types/auth";

export function LoginForm() {
  const [step, setStep] = useState<AuthStep>("EMAIL_INPUT");
  const [userEmail, setUserEmail] = useState<string>("");
  const [cooldown, setCooldown] = useState<number>(60);

  const handleCodeSent = (email: string, cooldownSeconds?: number) => {
    setUserEmail(email);
    setCooldown(cooldownSeconds ?? 60);
    setStep("OTP_VERIFY");
  };

  const handleBackToEmail = () => {
    setStep("EMAIL_INPUT");
  };

  return (
    <AuthCard
      title={step === "EMAIL_INPUT" ? "Welcome back" : undefined}
      subtitle={
        step === "EMAIL_INPUT"
          ? "Sign in to your FinOS account"
          : undefined
      }
    >
      {step === "EMAIL_INPUT" ? (
        <div className="space-y-3.5">
          <EmailLogin onCodeSent={handleCodeSent} />

          {/* Clean minimal divider */}
          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <GoogleLoginButton />

          {/* Create an account link */}
          <div className="text-center pt-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("email-input") as HTMLInputElement;
                  if (input) input.focus();
                }}
                className="font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      ) : (
        <OTPVerification
          email={userEmail}
          initialCooldown={cooldown}
          onBack={handleBackToEmail}
        />
      )}
    </AuthCard>
  );
}
