"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { reportsApi, RealReportItem, RealReportDetail } from "@/lib/api/reports";
import type { SentimentImpactState } from "@/lib/api/analysis";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  FileText,
  Download,
  Loader2,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

interface SectionInfo {
  key: string;
  name: string;
  dotColor: string;
}

const FULL_REPORT = "FULL_REPORT";

const SECTIONS_LIST: SectionInfo[] = [
  { key: "sentiment", name: "Sentiment", dotColor: "#10b981" },
  { key: "observed_facts", name: "Observed Facts", dotColor: "#3b82f6" },
  { key: "events", name: "Events", dotColor: "#8b5cf6" },
  { key: "impact_hypotheses", name: "Impact Hypotheses", dotColor: "#f59e0b" },
  { key: "data_quality", name: "Data Quality", dotColor: "#06b6d4" },
  { key: "unavailable_evidence", name: "Unavailable Evidence", dotColor: "#ef4444" },
];

function FormatInline({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={i} className="font-bold text-slate-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={i}
              className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700/60"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
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

function ReportsContent() {
  const searchParams = useSearchParams();
  const queryReportId = searchParams.get("id");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reportsList, setReportsList] = useState<RealReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(queryReportId);
  const [reportDetail, setReportDetail] = useState<RealReportDetail | null>(null);
  const [activeTab, setActiveTab] = useState<string>(FULL_REPORT);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingList(false);
      return;
    }

    async function loadReports() {
      try {
        setLoadingList(true);
        const data = await reportsApi.getReports();
        setReportsList(data);
        if (queryReportId && data.some((r) => r.id === queryReportId)) {
          setSelectedReportId(queryReportId);
        } else if (data.length > 0 && !selectedReportId) {
          setSelectedReportId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load user reports:", err);
      } finally {
        setLoadingList(false);
      }
    }

    loadReports();
  }, [isAuthenticated, queryReportId]);

  useEffect(() => {
    if (!selectedReportId || !isAuthenticated) return;

    const reportId = selectedReportId;
    async function loadDetail() {
      try {
        setLoadingDetail(true);
        const detail = await reportsApi.getReportDetail(reportId);
        setReportDetail(detail);
      } catch (err) {
        console.error("Failed to load report detail:", err);
      } finally {
        setLoadingDetail(false);
      }
    }

    loadDetail();
  }, [selectedReportId, isAuthenticated]);

  const handleDownloadPdf = async () => {
    if (!selectedReportId || !reportDetail) return;
    try {
      setDownloading("pdf");
      const url = reportsApi.getPdfUrl(selectedReportId);
      await reportsApi.downloadFile(url, `finos_report_${reportDetail.entity_id}_${selectedReportId}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadCsv = async () => {
    if (!selectedReportId || !reportDetail) return;
    try {
      setDownloading("csv");
      const url = reportsApi.getCsvUrl(selectedReportId);
      await reportsApi.downloadFile(url, `finos_report_${reportDetail.entity_id}_${selectedReportId}.csv`);
    } catch (err) {
      console.error("CSV download failed:", err);
    } finally {
      setDownloading(null);
    }
  };

  const renderFullReport = (markdown: string) => {
    const sections = markdown.split(/(?=\n#{1,3}\s)/);
    return (
      <div className="space-y-4">
        {sections.map((sec: string, idx: number) => {
          const lines = sec.trim().split("\n");
          const firstLine = lines[0] || "";
          const bodyLines = lines.slice(1);
          const isHeading = firstLine.startsWith("#");
          const cleanHeading = firstLine.replace(/^#{1,3}\s*/, "").trim();

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3"
            >
              {isHeading && (
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <h3 className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-white uppercase">
                    {cleanHeading}
                  </h3>
                </div>
              )}
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                {(isHeading ? bodyLines : lines).map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  if (trimmed === "---" || trimmed === "***") return null;
                  if (trimmed.startsWith("> ")) {
                    const quoteContent = trimmed.replace(/^>\s*/, "");
                    return (
                      <div
                        key={lIdx}
                        className="p-3 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-emerald-500 text-xs text-slate-700 dark:text-slate-300 italic"
                      >
                        <FormatInline text={quoteContent} />
                      </div>
                    );
                  }
                  if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
                    const subHeading = trimmed.replace(/^#{3,4}\s*/, "");
                    return (
                      <h4
                        key={lIdx}
                        className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800"
                      >
                        <FormatInline text={subHeading} />
                      </h4>
                    );
                  }
                  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    const content = trimmed.replace(/^[-*]\s*/, "");
                    return (
                      <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          <FormatInline text={content} />
                        </span>
                      </div>
                    );
                  }
                  return (
                    <p key={lIdx} className="my-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <FormatInline text={trimmed} />
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedSection = () => {
    if (!reportDetail || !reportDetail.state) {
      return (
        <div className="p-6 text-sm text-slate-500">
          No structured report recorded for this analysis.
        </div>
      );
    }

    const state = reportDetail.state as unknown as SentimentImpactState;
    const report = state.report;
    const sentiment = report?.sentiment;
    const entityId = reportDetail.entity_id || state.request?.entity_id || "N/A";
    const asOfDate = reportDetail.as_of_date || state.request?.as_of_date || "Current";

    if (activeTab === FULL_REPORT) {
      const markdown = reportDetail.final_report || "Full report content unavailable.";
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Sentiment &amp; Market Impact — <span className="text-emerald-400 font-mono">{entityId}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>As of {asOfDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sentiment Band
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-wide truncate">
                  {sentiment ? String(sentiment.band).replace(/_/g, " ") : "N/A"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Score
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-400 font-mono tracking-wide truncate">
                  {sentiment?.score === null || sentiment?.score === undefined ? "n/a" : `${sentiment.score}/10`}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Confidence
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-cyan-400 uppercase tracking-wide truncate">
                  {sentiment?.confidence || "N/A"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Data Status
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-purple-400 font-mono tracking-wide truncate">
                  {state.data_status || "N/A"}
                </div>
              </div>
            </div>
          </div>
          {renderFullReport(markdown)}
        </div>
      );
    }

    if (!report) {
      return (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          No report payload recorded for this analysis.
        </div>
      );
    }

    if (activeTab === "sentiment") {
      const s = report.sentiment;
      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <SectionCard title="Sentiment">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Band</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {String(s.band).replace(/_/g, " ")}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Score</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {s.score === null || s.score === undefined ? "n/a" : `${s.score}/10`}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Confidence</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{s.confidence}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400">Source</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{s.source}</div>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{s.rationale}</p>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "observed_facts") {
      const facts = report.observed_facts || [];
      return (
        <SectionCard title={`Observed Facts (${facts.length})`}>
          {facts.length === 0 ? (
            <p className="text-xs text-slate-500">No evidence available.</p>
          ) : (
            <div className="space-y-2">
              {facts.map((ref) => (
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
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ref.title}</div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                    >
                      {ref.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      );
    }

    if (activeTab === "events") {
      const events = report.events || [];
      return (
        <SectionCard title={`Events (${events.length})`}>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500">No events identified.</p>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.event_id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">{event.event_type}</span>
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
      );
    }

    if (activeTab === "impact_hypotheses") {
      const paths = report.impact_hypotheses || [];
      return (
        <SectionCard title={`Impact Hypotheses (${paths.length})`}>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Hypotheses only — not verified causal claims.
          </p>
          {paths.length === 0 ? (
            <p className="text-xs text-slate-500">No impact hypotheses derived.</p>
          ) : (
            <div className="space-y-2">
              {paths.map((path) => (
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
      );
    }

    if (activeTab === "data_quality") {
      const dq = report.data_quality;
      return (
        <SectionCard title="Data Quality">
          <div className="space-y-2">
            {(dq?.sources || []).map((source, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100">{source.vendor}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {source.status} • {source.freshness}
                </span>
              </div>
            ))}
            {(dq?.missing_inputs || []).length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Missing Inputs</div>
                <div className="flex flex-wrap gap-1.5">
                  {(dq.missing_inputs || []).map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-mono">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      );
    }

    if (activeTab === "unavailable_evidence") {
      const unavailable = report.unavailable_evidence || [];
      return (
        <SectionCard title={`Unavailable Evidence (${unavailable.length})`}>
          {unavailable.length === 0 ? (
            <p className="text-xs text-slate-500">None.</p>
          ) : (
            <div className="space-y-2">
              {unavailable.map((item, idx) => (
                <div
                  key={idx}
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
      );
    }

    return (
      <div className="p-6 text-sm text-slate-500">Select a section to view its details.</div>
    );
  };

  return (
    <AppShell
      headerTitle="Financial Reports"
      headerSubtitle="Persistent sentiment & market-impact dossiers generated by FinOS"
    >
      <div className="space-y-6">
        {!authLoading && !isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Please sign in to view your persistent sentiment & market-impact reports.</span>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
            >
              Sign In
            </Link>
          </div>
        )}

        <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Persisted Analysis Record
            </label>
            {loadingList ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading reports...</span>
              </div>
            ) : reportsList.length === 0 ? (
              <div className="text-xs font-medium text-slate-500">
                No reports saved yet. Execute an analysis in{" "}
                <Link href="/ask" className="text-emerald-600 dark:text-emerald-400 underline font-bold">
                  Ask FinOS
                </Link>{" "}
                to generate a persistent dossier.
              </div>
            ) : (
              <select
                value={selectedReportId || ""}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full max-w-xl px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {reportsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.entity_id}] {r.request.length > 50 ? r.request.substring(0, 50) + "..." : r.request} ({r.as_of_date || r.created_at.substring(0, 10)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {reportDetail && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading === "pdf"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {downloading === "pdf" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={downloading === "csv"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition border border-slate-700 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {downloading === "csv" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>Download CSV</span>
              </button>
            </div>
          )}
        </div>

        {selectedReportId && (
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 flex flex-col justify-between shrink-0">
              <div>
                <div className="px-2 py-2 mb-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    REPORT SECTIONS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {SECTIONS_LIST.length + 1} Views
                  </span>
                </div>

                <div className="space-y-1">
                  {SECTIONS_LIST.map((section) => {
                    const isActive = activeTab === section.key;
                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => setActiveTab(section.key)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          isActive
                            ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: section.dotColor }}
                        />
                        <span className="truncate">{section.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab(FULL_REPORT)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === FULL_REPORT
                      ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Full Report</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
              {loadingDetail ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="text-xs font-mono">Loading persisted report details...</span>
                </div>
              ) : (
                renderSelectedSection()
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <AppShell headerTitle="Financial Reports">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Loading Financial Reports...</span>
            </div>
          </div>
        </AppShell>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
