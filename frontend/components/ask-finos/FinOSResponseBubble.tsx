"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";
import { AgentCollaborationFlow } from "./AgentCollaborationFlow";
import {
  Bot,
  User,
  CheckCircle2,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface ConversationMessage {
  id: string;
  sender: "user" | "finos";
  text: string;
  timestamp: string;
  agentsConsulted?: AgentId[];
  agentDetails?: Record<string, { id: AgentId; status?: string; data_quality?: string }>;
  consensusScore?: number;
  findings?: string[];
  actions?: string[];
  sources?: string[];
  deepReasoning?: boolean;
  isAuthError?: boolean;
  analysisId?: string;
  entity_id?: string;
}

interface FinOSResponseBubbleProps {
  message: ConversationMessage;
  onOpenAgent: (agentId: AgentId) => void;
}

export function FinOSResponseBubble({ message, onOpenAgent }: FinOSResponseBubbleProps) {
  const isUser = message.sender === "user";
  const [isFindingsExpanded, setIsFindingsExpanded] = useState(true);

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="space-y-1 max-w-2xl text-right">
          <div className="inline-block p-4 rounded-3xl rounded-tr-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs sm:text-sm leading-relaxed shadow-sm font-medium">
            {message.text}
          </div>
          <div className="text-[10px] text-slate-400 font-mono pr-1">{message.timestamp}</div>
        </div>
        <div className="h-8 w-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs shadow-sm">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  const reportUrl = message.analysisId ? `/reports?id=${message.analysisId}` : "/reports";

  return (
    <div className="flex items-start gap-3">
      {/* FinOS Engine Avatar */}
      <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-md shadow-emerald-600/20">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-3 max-w-3xl flex-1">
        {/* Main Text Answer Box */}
        <div className="p-4 sm:p-5 rounded-3xl rounded-tl-xs bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm leading-relaxed shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                FinOS Analysis
              </span>
              {message.deepReasoning && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Deep Financial Reasoning
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{message.timestamp}</span>
          </div>

          <div className="whitespace-pre-wrap">{message.text}</div>

          {message.isAuthError && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              >
                <span>Sign In to FinOS Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Multi-Agent Collaboration Flow Box */}
        {message.agentsConsulted && message.agentsConsulted.length > 0 && (
          <AgentCollaborationFlow
            agentsConsulted={message.agentsConsulted}
            agentDetails={message.agentDetails}
            consensusScore={message.consensusScore}
            onAgentClick={onOpenAgent}
          />
        )}

        {/* Clickable Agents Consulted Chips */}
        {message.agentsConsulted && message.agentsConsulted.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
              Agents Consulted:
            </span>
            {message.agentsConsulted.map((aId) => {
              const ag = ALL_AGENTS.find((a) => a.id === aId);
              return (
                <button
                  key={aId}
                  onClick={() => onOpenAgent(aId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ag?.accentColor || "#10b981" }}
                  />
                  <span>{ag?.name || aId}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Structured Key Findings */}
        {message.findings && message.findings.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <button
              onClick={() => setIsFindingsExpanded(!isFindingsExpanded)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Key Takeaways &amp; Synthesized Findings ({message.findings.length})</span>
              </div>
              {isFindingsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isFindingsExpanded && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 animate-in fade-in">
                {/* Findings Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {message.findings.map((finding, idx) => {
                    const parts = finding.split(" | ");
                    const title = parts[0] || finding;
                    const metrics = parts.slice(1);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/80 space-y-1"
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {title}
                        </div>
                        {metrics.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {metrics.map((m, mIdx) => (
                              <span
                                key={mIdx}
                                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Recommended Actions */}
                {message.actions && message.actions.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Recommended Actions:
                    </span>
                    {message.actions.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources / Evidence */}
                {message.sources && message.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-400 uppercase">Sources:</span>
                    {message.sources.map((src, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Secondary Compact Report Link */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
                  <Link
                    href={reportUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generate Full Report →</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
