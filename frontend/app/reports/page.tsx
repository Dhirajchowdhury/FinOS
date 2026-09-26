"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { reportsApi, RealReportItem, RealReportDetail } from "@/lib/api/reports";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  FileText,
  Download,
  Loader2,
  Lock,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

interface AgentKeyInfo {
  key: string;
  name: string;
  dotColor: string;
}

const AGENTS_LIST: AgentKeyInfo[] = [
  { key: "investment", name: "Investment", dotColor: "#10b981" },
  { key: "news", name: "News", dotColor: "#3b82f6" },
  { key: "macro", name: "Macro Economy", dotColor: "#8b5cf6" },
  { key: "risk", name: "Risk", dotColor: "#f59e0b" },
  { key: "tax", name: "Tax", dotColor: "#06b6d4" },
  { key: "report", name: "Report", dotColor: "#ec4899" },
  { key: "trading", name: "Trading", dotColor: "#6366f1" },
  { key: "fraud", name: "Fraud", dotColor: "#ef4444" },
  { key: "credit", name: "Credit", dotColor: "#14b8a6" },
  { key: "portfolio", name: "Portfolio", dotColor: "#a855f7" },
];

function ReportsContent() {
  const searchParams = useSearchParams();
  const queryReportId = searchParams.get("id");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reportsList, setReportsList] = useState<RealReportItem[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(queryReportId);
  const [reportDetail, setReportDetail] = useState<RealReportDetail | null>(null);
  const [activeTab, setActiveTab] = useState<string>("FULL_REPORT"); // "FULL_REPORT" | agent_key
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "csv" | null>(null);

  // Load user reports list
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

  // Load selected report detail
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

  const renderSelectedAgentOutput = () => {
    if (!reportDetail || !reportDetail.state) {
      return (
        <div className="p-6 text-sm text-slate-500">
          No structured state recorded for this report.
        </div>
      );
    }

    const state = reportDetail.state;
    const entityId = reportDetail.entity_id || state.entity_id || "N/A";
    const asOfDate = reportDetail.as_of_date || state.as_of_date || "Current";

    // Extract key metrics for Executive Takeaways card
    const stance = state.investment?.findings?.rating || state.investment?.findings?.thesis || state.investment?.summary || "Hold";
    const stanceLabel = typeof stance === "string" ? stance.split(".")[0].substring(0, 40) : "Hold";
    
    const riskLevel = state.risk?.findings?.overall_risk_level || state.risk?.summary || "Medium";
    const riskLabel = typeof riskLevel === "string" ? riskLevel.split(".")[0].substring(0, 30) : "Medium";
    
    const creditRating = state.credit?.findings?.rating || state.credit?.findings?.credit_rating || "BBB";
    const confidenceVal = state.investment?.confidence || state.report?.confidence || 0.8;
    const confidencePct = `${Math.round(confidenceVal * 100)}%`;

    if (activeTab === "FULL_REPORT") {
      const markdown =
        reportDetail.final_report ||
        state.report?.metadata?.full_report_markdown ||
        state.report?.summary ||
        "Full report content unavailable.";

      // Process markdown into scannable visual sections
      const sections = markdown.split(/(?=\n#{1,3}\s)/);

      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Key Takeaways Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Executive Financial Dossier — <span className="text-emerald-400 font-mono">{entityId}</span>
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
                  Investment Stance
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-wide truncate">
                  {stanceLabel}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Overall Risk Level
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide truncate">
                  {riskLabel}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Credit Solvency Rating
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-cyan-400 font-mono tracking-wide truncate">
                  {creditRating}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Model Confidence
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-purple-400 font-mono tracking-wide">
                  {confidencePct}
                </div>
              </div>
            </div>
          </div>

          {/* Scannable Markdown Sections */}
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

                      // Bullet point styling
                      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                        const content = trimmed.replace(/^[-*]\s*/, "");
                        return (
                          <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{content}</span>
                          </div>
                        );
                      }

                      return (
                        <p key={lIdx} className="my-1">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const agentKey = activeTab;
    const agentObj = state[agentKey];
    const agentMeta = AGENTS_LIST.find((a) => a.key === agentKey);
    const agentTitle = agentMeta?.name || agentKey.toUpperCase();

    if (!agentObj) {
      return (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          No persistent output recorded for <strong>{agentTitle}</strong> in this analysis.
        </div>
      );
    }

    const summary = agentObj.summary || (typeof agentObj === "string" ? agentObj : "Completed");
    const status = agentObj.status || (summary ? "REAL" : "COMPLETED");
    const findings = agentObj.findings;
    const evidence = agentObj.evidence;
    const metadata = agentObj.metadata;

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: agentMeta?.dotColor || "#10b981" }}
            />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {agentTitle} Assessment
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {status}
          </span>
        </div>

        {/* Summary Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Agent Executive Summary
          </div>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Structured Findings Section */}
        {findings && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Structured Findings &amp; Metrics
            </div>
            {typeof findings === "object" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(findings).map(([fKey, fVal]) => {
                  if (fVal === null || fVal === undefined) return null;
                  const displayVal = typeof fVal === "object" ? JSON.stringify(fVal) : String(fVal);
                  return (
                    <div key={fKey} className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        {fKey.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {displayVal}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-800 dark:text-slate-200">{String(findings)}</p>
            )}
          </div>
        )}

        {/* Supporting Evidence */}
        {Array.isArray(evidence) && evidence.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Supporting Signals &amp; Evidence
            </div>
            <div className="space-y-2">
              {evidence.map((ev: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata & Provenance */}
        {metadata && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Data Quality &amp; Provenance
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
              {metadata.source && <div>Source: {metadata.source}</div>}
              {metadata.news_scope && <div>Scope: {metadata.news_scope}</div>}
              {metadata.tax_calculation_status && <div>Tax Status: {metadata.tax_calculation_status}</div>}
              {metadata.transaction_monitoring_status && <div>Fraud Status: {metadata.transaction_monitoring_status}</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell
      headerTitle="Financial Reports"
      headerSubtitle="Real persistent institutional dossiers generated by FinOS 10-agent workflows"
    >
      <div className="space-y-6">
        {!authLoading && !isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Please sign in to view your real persistent financial analysis reports.</span>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Top Controls: Report Selector & Action Buttons */}
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

          {/* Action Buttons: PDF & CSV Download */}
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

        {/* Main Report View Layout: Compact 10-Agent Sidebar + Main Content Panel */}
        {selectedReportId && (
          <div className="bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* LEFT COMPACT SIDEBAR: 10 AGENTS LIST + GREEN FULL REPORT BUTTON */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 flex flex-col justify-between shrink-0">
              <div>
                <div className="px-2 py-2 mb-2 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    FINOS AGENTS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    10 Active
                  </span>
                </div>

                <div className="space-y-1">
                  {AGENTS_LIST.map((ag) => {
                    const isActive = activeTab === ag.key;
                    const agentState = reportDetail?.state ? reportDetail.state[ag.key] : null;
                    const rawStatus = agentState?.status || (agentState?.summary ? "REAL" : "ACTIVE");
                    const statusBadge = typeof rawStatus === "string" ? rawStatus.toUpperCase() : "ACTIVE";

                    return (
                      <button
                        key={ag.key}
                        type="button"
                        onClick={() => setActiveTab(ag.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          isActive
                            ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: ag.dotColor }}
                          />
                          <span className="truncate">{ag.name}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 ml-1">
                          {statusBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Green Generate Full Report Button - Positioned directly below Portfolio agent section */}
              <div className="pt-4 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("FULL_REPORT")}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === "FULL_REPORT"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-400"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate Full Report</span>
                </button>
              </div>
            </div>

            {/* RIGHT MAIN PANEL: SELECTED AGENT OR FULL REPORT */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
              {loadingDetail ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="text-xs font-mono">Loading persisted report details...</span>
                </div>
              ) : (
                renderSelectedAgentOutput()
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
