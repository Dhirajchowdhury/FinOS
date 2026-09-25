"use client";

import React, { useState, useEffect } from "react";
import { OTPInput } from "./OTPInput";
import { api } from "@/lib/api";
import { Clock, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OTPVerificationProps {
  email: string;
  initialCooldown?: number;
  onBack: () => void;
  onSuccessRedirect?: () => void;
}

export function OTPVerification({
  email,
  initialCooldown = 60,
  onBack,
  onSuccessRedirect,
}: OTPVerificationProps) {
  const { checkSession } = useAuth();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 5 minutes expiry countdown (300 seconds)
  const [expirySeconds, setExpirySeconds] = useState(300);
  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(initialCooldown);

  // Expiry timer countdown
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async (otpToVerify?: string) => {
    const targetCode = otpToVerify || code;
    if (targetCode.length !== 6) return;

    if (expirySeconds <= 0) {
      setErrorMessage("This verification code has expired. Please request a new code.");
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage(null);

      await api.verifyEmailCode(email, targetCode);
      setIsSuccess(true);
      await checkSession();

      setTimeout(() => {
        if (onSuccessRedirect) {
          onSuccessRedirect();
        } else {
          window.location.href = "/dashboard";
        }
      }, 700);
    } catch (err: unknown) {
      setIsVerifying(false);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Incorrect verification code. Please try again.");
      }
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (errorMessage) setErrorMessage(null);

    // Auto submit when 6 digits are fully filled
    if (newCode.length === 6) {
      handleVerify(newCode);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setErrorMessage(null);
      const res = await api.requestEmailCode(email);

      // Reset timers
      setExpirySeconds(300);
      setResendCooldown(res.cooldown_seconds ?? 60);
      setCode("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Unable to resend code. Please wait and try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <div>
        <button
          type="button"
          onClick={onBack}
          disabled={isVerifying || isSuccess}
          className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors mb-1.5 focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change email address</span>
        </button>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Verify your email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
        </p>
      </div>

      {/* 6-digit OTP Input */}
      <div>
        <OTPInput
          value={code}
          onChange={handleCodeChange}
          disabled={isVerifying || isSuccess}
          isError={!!errorMessage}
          length={6}
        />

        {/* Expiry Timer Indicator */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>
              {expirySeconds > 0 ? (
                <>
                  Code expires in{" "}
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {formatTimer(expirySeconds)}
                  </span>
                </>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-medium">Code expired</span>
              )}
            </span>
          </div>

          <div>
            {resendCooldown > 0 ? (
              <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition focus:outline-none cursor-pointer text-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                <span>Resend code</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">Verification successful! Redirecting to FinOS...</span>
        </div>
      )}

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => handleVerify()}
        disabled={isVerifying || isSuccess || code.length !== 6 || expirySeconds <= 0}
        className="w-full bg-[#047857] hover:bg-[#065f46] text-white py-3 px-5 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 hover:shadow-lg transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-emerald-600/20"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Verifying...</span>
          </>
        ) : isSuccess ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Verified</span>
          </>
        ) : (
          <span>Verify & Enter FinOS</span>
        )}
      </button>

      <div className="text-center pt-1">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Didn&apos;t receive the code? Check spam or{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium underline underline-offset-2 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:no-underline cursor-pointer"
          >
            resend code
          </button>
        </span>
      </div>
    </div>
  );
}
