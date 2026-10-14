"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  analysisApi,
  SentimentImpactState,
  EvidenceRef,
  EventClaim,
  TransmissionPath,
  RelevanceSummary,
  SourceQuality,
  UnavailableEvidence,
} from "@/lib/api/analysis";
import { FinOSApiError } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Lock,
  FileText,
  Clock,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  Calendar,
} from "lucide-react";

const WINDOW_OPTIONS = [7, 14, 30, 60, 90];
const MARKET_OPTIONS = ["NSE India", "NYSE", "NASDAQ", "Global"];

// Letters/digits plus the characters Yahoo tickers may contain (., -, ^, &).
const TICKER_RE = /^[A-Za-z0-9][A-Za-z0-9.\-^&]{0,14}$/;

type Phase = "idle" | "loading" | "error" | "success";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function statusTone(status: string | undefined): string {
  switch ((status || "").toUpperCase()) {
    case "AVAILABLE":
      return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "PARTIAL":
      return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    case "UNAVAILABLE":
    case "FAILED":
      return "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  }
}

const RELEVANCE_LABELS: Record<string, string> = {
  COMPANY_SPECIFIC: "Company-specific",
  SECTOR_RELEVANT: "Sector-relevant",
  MACRO_CONTEXT: "Macro context",
  IRRELEVANT: "Irrelevant",
};

function relevanceTone(relevance: string | null | undefined): string {
  switch ((relevance || "").toUpperCase()) {
    case "COMPANY_SPECIFIC":
      return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    case "SECTOR_RELEVANT":
      return "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "MACRO_CONTEXT":
      return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
}

function RelevanceBadge({ relevance }: { relevance: string | null | undefined }) {
  if (!relevance) return null;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${relevanceTone(relevance)}`}>
      {RELEVANCE_LABELS[String(relevance).toUpperCase()] || relevance}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <h3 className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-white uppercase">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
      <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
      <div className="text-sm font-bold text-slate-900 dark:text-white break-words">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-xs text-slate-700 dark:text-slate-300 break-words">{value}</span>
    </div>
  );
}

function SentimentAnalysisContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [ticker, setTicker] = useState("");
  const [asOfDate, setAsOfDate] = useState(todayIso());
  const [windowDays, setWindowDays] = useState(7);
  const [market, setMarket] = useState("NSE India");
  const [focus, setFocus] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [result, setResult] = useState<SentimentImpactState | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = ticker.trim().toUpperCase();

    if (!symbol) {
      setFieldError("Enter a stock ticker or company identifier (e.g. TCS.NS or RELIANCE.NS).");
      return;
    }
    if (!TICKER_RE.test(symbol)) {
      setFieldError(
        "Use a valid ticker format, e.g. TCS.NS or RELIANCE.NS (letters, digits, . - ^ & only)."
      );
      return;
    }
    setFieldError(null);
    setError(null);
    setIsAuthError(false);
    setResult(null);
    setPhase("loading");

    try {
      const state = await analysisApi.runAnalysis({
        entity_id: symbol,
        request:
          focus.trim() ||
          `Assess recent news sentiment and market impact for ${symbol}.`,
        market,
        as_of_date: asOfDate || undefined,
        window_days: windowDays,
      });
      setResult(state);
      setPhase("success");
    } catch (err: unknown) {
      let message = "An error occurred while running the sentiment & market-impact analysis.";
      let authErr = false;

      if (err instanceof FinOSApiError) {
        const code = err.status;
        if (code === 401) {
          authErr = true;
          message = "Authentication required. Please sign in to your FinOS account to run sentiment analysis.";
        } else if (code === 400 || code === 422) {
          message = `Request rejected (${code}): ${err.message}`;
        } else if (code === 0) {
          message = "Unable to reach the FinOS backend service. Ensure the FastAPI server is running.";
        } else if (code >= 500) {
          message = `FinOS service error (${code}): ${err.message}`;
        } else {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
      setIsAuthError(authErr);
      setPhase("error");
    }
  };

  const report = result?.report;
  const sentiment = report?.sentiment;
  const observedFacts: EvidenceRef[] = report?.observed_facts || [];
  const events: EventClaim[] = report?.events || [];
  const hypotheses: TransmissionPath[] = report?.impact_hypotheses || [];
  const sources: SourceQuality[] = report?.data_quality?.sources || [];
  const missingInputs: string[] = report?.data_quality?.missing_inputs || [];
  const unavailable: UnavailableEvidence[] = report?.unavailable_evidence || [];
  const relevanceSummary: RelevanceSummary | undefined = report?.relevance_summary || undefined;

  const isNoEvidence =
    phase === "success" &&
    !!result &&
    (result.data_status === "UNAVAILABLE" || !sentiment || sentiment.source === "none");

  return (
    <AppShell
      headerTitle="Sentiment Analysis & Market Impact"
      headerSubtitle="Deterministic news-sentiment baseline with optional LLM enrichment"
    >
      <div className="space-y-6">
        {!authLoading && !isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Please sign in to run sentiment & market-impact analysis.</span>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Intro */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <LineChart className="w-5 h-5" />
            </div>
            <h1 className="text-base sm:text-lg font-black tracking-tight">
              Sentiment Analysis &amp; Market Impact
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            This feature normalises recent company and market news and classifies every article by
            content — <span className="text-emerald-400 font-semibold">company-specific</span>,
            sector-relevant, shared macro, or irrelevant — so unrelated articles never reach the score.
            It applies a transparent
            <span className="text-emerald-400 font-semibold"> deterministic keyword baseline</span> (and an
            optional LLM sentiment read when a provider key is configured) to company-specific evidence only,
            then reports an honest, evidence-backed view: overall sentiment, the observed facts behind it,
            detected events, and market-impact <span className="font-semibold">hypotheses</span> — never proven
            causation. Unavailable evidence is surfaced explicitly rather than fabricated.
          </p>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleAnalyze}
          className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-1">
              <label htmlFor="ticker" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Ticker / Company
              </label>
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="TCS.NS"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={!!fieldError}
                className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border text-sm font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                  fieldError
                    ? "border-red-400 dark:border-red-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              />
            </div>

            <div className="md:col-span-1">
              <label htmlFor="asOf" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                As-of Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="asOf"
                  type="date"
                  value={asOfDate}
                  max={todayIso()}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <label htmlFor="window" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Analysis Window
              </label>
              <select
                id="window"
                value={windowDays}
                onChange={(e) => setWindowDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {WINDOW_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    Last {d} days
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label htmlFor="market" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Market
              </label>
              <select
                id="market"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {MARKET_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="focus" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Analysis Focus <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <input
              id="focus"
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Assess recent news sentiment and market impact…"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {fieldError && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fieldError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[10px] text-slate-400 font-mono">
              POST /analysis · request, entity_id, market, as_of_date, window_days
            </p>
            <button
              type="submit"
              disabled={phase === "loading"}
              aria-busy={phase === "loading"}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black tracking-tight transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {phase === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {phase === "error" && error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-medium flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>{error}</p>
              {isAuthError && (
                <Link
                  href="/login"
                  className="inline-block px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Idle helper */}
        {phase === "idle" && (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <TrendingUp className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Enter a ticker (e.g. <span className="font-mono font-bold">TCS.NS</span>,{" "}
              <span className="font-mono font-bold">RELIANCE.NS</span>) and select a window to run an analysis.
            </p>
          </div>
        )}

        {/* Results */}
        {phase === "success" && result && (
          <div className="space-y-5">
            {/* Status header */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                    Analysis Complete
                    <span className="text-slate-400 font-mono font-bold ml-2">
                      {result.request?.entity_id}
                    </span>
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wide ${statusTone(
                    result.data_status
                  )}`}
                >
                  {result.data_status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="Analysis As-of" value={result.request?.as_of_date || "—"} />
                <Metric label="Window" value={`${result.request?.window_days ?? windowDays} days`} />
                <Metric label="Market" value={result.request?.market || market} />
                <Metric
                  label="Contract"
                  value={<span className="font-mono">v{result.contract_version}</span>}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                <span className="font-mono text-slate-400">Report ID: {result.id || result.analysis_id || "—"}</span>
                {result.id && (
                  <Link
                    href={`/reports?id=${result.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold transition border border-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View saved report
                  </Link>
                )}
              </div>
            </div>

            {/* Backend errors */}
            {result.errors && result.errors.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Partial data warnings ({result.errors.length})</span>
                </div>
                <ul className="list-disc pl-6 space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {isNoEvidence && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                No <strong>company-specific</strong> news evidence was found for this entity and window, so
                no defensible sentiment conclusion can be drawn. Retrieved articles not linked to the
                company were excluded from scoring. See <strong>Evidence Relevance</strong>,{" "}
                <strong>Data Quality</strong> and <strong>Unavailable Evidence</strong> below.
              </div>
            )}

            {/* Sentiment */}
            {sentiment && (
              <SectionCard title="Sentiment">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Metric
                    label="Band"
                    value={<span className="uppercase">{String(sentiment.band).replace(/_/g, " ")}</span>}
                  />
                  <Metric
                    label="Score"
                    value={sentiment.score === null || sentiment.score === undefined ? "n/a" : `${sentiment.score}/10`}
                  />
                  <Metric label="Confidence" value={sentiment.confidence} />
                  <Metric label="Source" value={sentiment.source} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Metric label="Method" value={<span className="font-mono text-[11px]">{sentiment.method || "n/a"}</span>} />
                  <Metric
                    label="Signals"
                    value={`${sentiment.positive_signals ?? 0} pos / ${sentiment.negative_signals ?? 0} neg`}
                  />
                  <Metric
                    label="Eligible Evidence"
                    value={`${sentiment.article_count ?? 0} of ${sentiment.total_retrieved ?? 0}`}
                  />
                  <Metric
                    label="Scored From"
                    value="Company-specific only"
                  />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sentiment.rationale}</p>
              </SectionCard>
            )}

            {/* Evidence relevance */}
            {relevanceSummary && (
              <SectionCard title="Evidence Relevance">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Metric label="Retrieved" value={relevanceSummary.total_retrieved} />
                  <Metric label="Company-Specific" value={relevanceSummary.company_specific} />
                  <Metric label="Sector-Relevant" value={relevanceSummary.sector_relevant} />
                  <Metric label="Macro Context" value={relevanceSummary.macro_context} />
                  <Metric label="Irrelevant" value={relevanceSummary.irrelevant} />
                  <Metric label="Scored" value={relevanceSummary.included_in_sentiment} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Only <strong>company-specific</strong> articles drive the sentiment score. Sector and
                  macro articles are retained as labelled context; irrelevant articles are excluded.
                </p>
              </SectionCard>
            )}

            {/* Observed facts */}
            <SectionCard title={`Observed Facts (${observedFacts.length})`}>
              {observedFacts.length === 0 ? (
                <p className="text-xs text-slate-500">No evidence available.</p>
              ) : (
                <div className="space-y-2">
                  {observedFacts.map((ref) => (
                    <div
                      key={ref.evidence_id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{ref.evidence_id}</span>
                        <span>•</span>
                        <span>{ref.source}</span>
                        {ref.published_at && (
                          <>
                            <span>•</span>
                            <span>{String(ref.published_at).substring(0, 10)}</span>
                          </>
                        )}
                        {ref.publisher && (
                          <>
                            <span>•</span>
                            <span>{ref.publisher}</span>
                          </>
                        )}
                        {ref.source_feed && (
                          <>
                            <span>•</span>
                            <span>{ref.source_feed}</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <RelevanceBadge relevance={ref.relevance} />
                        {ref.included_in_sentiment ? (
                          <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                            Scored
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Excluded from score
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ref.title}</div>
                      {ref.relevance_reason && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{ref.relevance_reason}</div>
                      )}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {ref.url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Events */}
            <SectionCard title={`Detected Events (${events.length})`}>
              {events.length === 0 ? (
                <p className="text-xs text-slate-500">No events identified.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <div
                      key={event.event_id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">{event.event_type}</span>
                        <RelevanceBadge relevance={event.relevance} />
                        {event.published_at && (
                          <span className="inline-flex items-center gap-1 normal-case">
                            <Clock className="w-3 h-3" />
                            {String(event.published_at).substring(0, 10)}
                          </span>
                        )}
                        <span>confidence: {event.confidence}</span>
                        <span>uncertainty: {event.uncertainty}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{event.summary}</div>
                      {(event.sectors?.length > 0 || event.macro_factors?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {(event.sectors || []).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                              {s}
                            </span>
                          ))}
                          {(event.macro_factors || []).map((m) => (
                            <span key={m} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Impact hypotheses */}
            <SectionCard title={`Market-Impact Hypotheses (${hypotheses.length})`}>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Hypotheses only — not verified causal claims.
              </p>
              {hypotheses.length === 0 ? (
                <p className="text-xs text-slate-500">No impact hypotheses derived.</p>
              ) : (
                <div className="space-y-2">
                  {hypotheses.map((path) => (
                    <div
                      key={path.pathway_id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {path.source_factor} → {path.target?.entity_id}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        {path.direction} • horizon: {path.horizon} • confidence: {path.confidence} • uncertainty: {path.uncertainty}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300">{path.mechanism}</p>
                      {path.supporting_evidence_ids?.length > 0 && (
                        <div className="text-[10px] font-mono text-slate-400">
                          evidence: {path.supporting_evidence_ids.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Data quality */}
            <SectionCard title="Data Quality">
              {sources.length === 0 && missingInputs.length === 0 ? (
                <p className="text-xs text-slate-500">No data-quality information returned.</p>
              ) : (
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <div
                      key={`${source.vendor}-${idx}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{source.vendor}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {source.status} • {source.freshness}
                      </span>
                    </div>
                  ))}
                  {missingInputs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Missing Inputs</div>
                      <div className="flex flex-wrap gap-1.5">
                        {missingInputs.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-mono"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Unavailable evidence */}
            <SectionCard title={`Unavailable Evidence (${unavailable.length})`}>
              {unavailable.length === 0 ? (
                <p className="text-xs text-slate-500">None — all expected inputs were available.</p>
              ) : (
                <div className="space-y-2">
                  {unavailable.map((item, idx) => (
                    <div
                      key={`${item.capability}-${idx}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>{item.capability}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Optional validation / causal fields (only when backend returns them) */}
            {report?.validation && (
              <SectionCard title="Historical Validation">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Field label="Status" value={report.validation.status} />
                  <Field label="Method" value={report.validation.method} />
                  <Field label="Window" value={report.validation.window} />
                  <Field label="Benchmark" value={report.validation.benchmark} />
                  <Field label="Abnormal Return" value={report.validation.abnormal_return} />
                  <Field label="Sample Size" value={report.validation.sample_size} />
                </div>
                {Array.isArray(report.validation.notes) && report.validation.notes.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    {report.validation.notes.map((n: string, i: number) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
                <Field label="Reason" value={report.validation.reason} />
              </SectionCard>
            )}

            {report?.causal && (
              <SectionCard title="Causal Assessment">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Field label="Status" value={report.causal.status} />
                  <Field label="Design" value={report.causal.design} />
                </div>
                {Array.isArray(report.causal.assumptions) && report.causal.assumptions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Assumptions</div>
                    <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      {report.causal.assumptions.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(report.causal.limitations) && report.causal.limitations.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Limitations</div>
                    <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      {report.causal.limitations.map((l: string, i: number) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Field label="Reason" value={report.causal.reason} />
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SentimentAnalysisPage() {
  return <SentimentAnalysisContent />;
}
