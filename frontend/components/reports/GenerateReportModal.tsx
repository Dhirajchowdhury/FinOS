"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Bot, Check, Loader2, ArrowRight } from "lucide-react";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { modalBackdropVariants, modalContentVariants } from "@/lib/motion";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (newReportTitle: string) => void;
}

export function GenerateReportModal({ isOpen, onClose, onGenerated }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState<string>("Multi-Agent");
  const [title, setTitle] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([
    "portfolio",
    "macro",
    "risk",
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState("");

  const toggleAgent = (id: string) => {
    if (selectedAgents.includes(id)) {
      if (selectedAgents.length > 1) {
        setSelectedAgents(selectedAgents.filter((a) => a !== id));
      }
    } else {
      setSelectedAgents([...selectedAgents, id]);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgressStage("Orchestrating agent consensus matrix...");

    setTimeout(() => {
      setProgressStage("Retrieving real-time market telemetry & RAG nodes...");
    }, 1000);

    setTimeout(() => {
      setProgressStage("Formatting institutional PDF artifact...");
    }, 2000);

    setTimeout(() => {
      setIsGenerating(false);
      onGenerated(title || `${reportType} Intelligence Briefing`);
      onClose();
    }, 2800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative"
          >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Generate Institutional Financial Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure cross-agent telemetry and automated synthesis parameters
            </p>
          </div>
        </div>

        {isGenerating ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Synthesizing Dossier</h4>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{progressStage}</p>
            </div>
            <div className="w-64 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-pulse rounded-full w-3/4" />
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Report Title / Objective
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Capital Allocation & Sector Stress Test"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Report Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Multi-Agent", "Portfolio", "Risk", "Tax", "Market", "Credit"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReportType(t)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                      reportType === t
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Collaborating AI Agents ({selectedAgents.length} Selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                {ALL_AGENTS.map((agent) => {
                  const isSelected = selectedAgents.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => toggleAgent(agent.id)}
                      className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 text-slate-900 dark:text-white font-medium"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: agent.accentColor }} />
                        <span className="truncate">{agent.shortName}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Trigger Multi-Agent Synthesis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
