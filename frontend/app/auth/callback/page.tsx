"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkSession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");

    if (errorParam) {
      setError(errorDesc || errorParam || "Google authentication failed.");
      return;
    }

    // Successfully returned from Google OAuth; check session and redirect
    checkSession().then((user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setError("Unable to establish session. Please try logging in again.");
      }
    });
  }, [searchParams, router, checkSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 finos-grid-bg">
        <div className="finos-card p-6 sm:p-8 rounded-2xl max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Authentication Error</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full btn-primary py-2.5 px-4 rounded-xl text-sm font-semibold mt-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center finos-grid-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">
          Finalizing Google OAuth authentication...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center finos-grid-bg">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
