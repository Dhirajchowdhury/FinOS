"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_PAYSLIP_RESULT, PayslipData } from "@/lib/mock/payslip";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { useToast } from "@/components/motion/Toast";
import {
  modalBackdropVariants,
  modalContentVariants,
  cardHoverVariants,
} from "@/lib/motion";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Eye,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Receipt,
  RotateCcw,
  Loader2,
  X,
} from "lucide-react";

export default function PayslipPage() {
  const { success, error } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<PayslipData | null>(null);
  const [generatedReportOpen, setGeneratedReportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      error("Unsupported File Format", "Please upload a valid PDF, JPG, JPEG, or PNG document.");
      return;
    }

    setSelectedFile(file);
    startWorkflow(file);
  };

  const startWorkflow = (file: File) => {
    // Step 2: Upload Progress
    setStep(2);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          // Step 3: Processing (OCR & Parsing)
          setStep(3);
          setTimeout(() => {
            // Step 4: Analysis
            setStep(4);
            setTimeout(() => {
              // Step 5: Results Ready
              setAnalysisResult({
                ...MOCK_PAYSLIP_RESULT,
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
              });
              setStep(5);
              success("Analysis Complete", "Payslip intelligence dossier generated successfully.");
            }, 1200);
          }, 1400);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStep(1);
    setUploadProgress(0);
    setAnalysisResult(null);
    setGeneratedReportOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDownload = () => {
    if (!analysisResult) return;
    const content = `FINOS INSTITUTIONAL PAYSLIP AUDIT DOSSIER\n\nEmployee: ${analysisResult.employeeName}\nRole: ${analysisResult.designation}\nPeriod: ${analysisResult.payPeriod}\nSource Document: ${analysisResult.fileName}\n\nINCOME SUMMARY:\n- Gross Salary: ₹${analysisResult.incomeSummary.grossSalary.toLocaleString()}\n- Net Salary: ₹${analysisResult.incomeSummary.netSalary.toLocaleString()}\n- Tax Deduction (TDS): ₹${analysisResult.incomeSummary.taxDeduction.toLocaleString()}\n- Other Deductions: ₹${analysisResult.incomeSummary.otherDeductions.toLocaleString()}\n\nAI OBSERVATIONS & PLANNING:\n${analysisResult.insights.map((i) => `[${i.type}] ${i.title}: ${i.description}`).join("\n")}\n\n[FinOS SHA-256 Ledger Verified]`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Payslip_Analysis_${analysisResult.payPeriod.replace(" ", "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      headerTitle="Payslip Intelligence & Tax Audit"
      headerSubtitle="Upload your payslip to receive structured income breakdowns and AI tax observations"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Step Indicator Header */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold mb-3">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">
              Workflow Progress
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">
              Step {step} of 5 — {step === 1 && "Select File"}
              {step === 2 && "Uploading..."}
              {step === 3 && "Extracting OCR Fields..."}
              {step === 4 && "Tax & Compensation Analysis..."}
              {step === 5 && "Dossier Ready"}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 1, label: "Upload" },
              { id: 2, label: "Extract" },
              { id: 3, label: "Process" },
              { id: 4, label: "Analyze" },
              { id: 5, label: "Results" },
            ].map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s.id <= step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: UPLOAD AREA */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6"
            >
              <div className="max-w-xl text-center mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mx-auto shadow-2xs">
                  <Receipt className="w-6 h-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                  Upload your payslip
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Upload a PDF or image of your payslip to get personalized financial analysis. Our Tax and Compensation agents automatically parse line items and compute regime efficiencies.
                </p>
              </div>

              {/* Drag & Drop Box */}
              <motion.div
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:border-emerald-500/60 hover:bg-slate-50 dark:hover:bg-slate-900/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 mx-auto flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Click to browse files
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400"> or drag and drop here</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supported formats: PDF, JPG, JPEG, PNG (Max 15MB)
                  </div>
                </div>
              </motion.div>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Client-side Encrypted</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Zero Data Sharing</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 2 to 4: PROGRESS UI */}
          {(step === 2 || step === 3 || step === 4) && (
            <motion.div
              key="step-progress"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-10 text-center space-y-6 shadow-xs"
            >
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {step === 2 && "Uploading Document..."}
                  {step === 3 && "Extracting Salary Line Items..."}
                  {step === 4 && "Running Tax & Net Income Evaluation..."}
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  {selectedFile?.name || "Salary_Slip_August_2026.pdf"}
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono text-right">
                  {uploadProgress}% Complete
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: RESULTS & PAYSLIP ANALYSIS DOSSIER */}
          {step === 5 && analysisResult && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {analysisResult.fileName}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {analysisResult.payPeriod} • {analysisResult.employeeName} ({analysisResult.designation})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Upload Another</span>
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setGeneratedReportOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Report</span>
                  </motion.button>
                </div>
              </div>

              {/* Income Summary (4 Cards) with AnimatedNumber */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs transition-shadow"
                >
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Gross Salary
                  </div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white font-mono mt-1">
                    <AnimatedNumber
                      value={analysisResult.incomeSummary.grossSalary}
                      prefix="₹"
                      decimals={0}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pre-tax monthly earnings</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs transition-shadow"
                >
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                    Net Salary (Take-Home)
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    <AnimatedNumber
                      value={analysisResult.incomeSummary.netSalary}
                      prefix="₹"
                      decimals={0}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-mono mt-0.5">
                    74.8% of gross compensation
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs transition-shadow"
                >
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Tax Deduction (TDS)
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                    <AnimatedNumber
                      value={analysisResult.incomeSummary.taxDeduction}
                      prefix="₹"
                      decimals={0}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Effective TDS: 17.6%</div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs transition-shadow"
                >
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Other Deductions
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                    <AnimatedNumber
                      value={analysisResult.incomeSummary.otherDeductions}
                      prefix="₹"
                      decimals={0}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">EPF, PT &amp; Insurance</div>
                </motion.div>
              </div>

              {/* Financial Breakdown: Earnings vs Deductions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Earnings Breakdown
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {analysisResult.breakdown.earnings.map((e) => (
                      <div key={e.item} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-1 rounded transition-colors">
                        <span className="text-slate-600 dark:text-slate-300">{e.item}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(e.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Earnings</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatINR(analysisResult.incomeSummary.grossSalary)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Statutory &amp; Voluntary Deductions
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {analysisResult.breakdown.deductions.map((d) => (
                      <div key={d.item} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-1 rounded transition-colors">
                        <span className="text-slate-600 dark:text-slate-300">{d.item}</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(d.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>Total Deductions</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        {formatINR(analysisResult.incomeSummary.taxDeduction + analysisResult.incomeSummary.otherDeductions)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights & Observations */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    AI Insights &amp; Tax Observations
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Generated by FinOS Tax Agent and Credit Agent
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {analysisResult.insights.map((ins, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -1.5 }}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            ins.type === "AI Insight"
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                              : ins.type === "Potential Opportunity"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : ins.type === "Suggested Action"
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {ins.type}
                        </span>
                        {ins.impact && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            {ins.impact}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {ins.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {ins.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GENERATED REPORT MODAL */}
        <AnimatePresence>
          {generatedReportOpen && analysisResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setGeneratedReportOpen(false)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
              />

              <motion.div
                variants={modalContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto z-10"
              >
                <button
                  onClick={() => setGeneratedReportOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                      Formal Dossier
                    </span>
                    <span className="text-xs text-slate-400">Generated Just Now</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Compensation &amp; Tax Deductions Dossier — {analysisResult.payPeriod}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Source Document: {analysisResult.fileName} ({analysisResult.fileSize})
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Executive Summary:
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Gross compensation of {formatINR(analysisResult.incomeSummary.grossSalary)} generates net liquid take-home of {formatINR(analysisResult.incomeSummary.netSalary)} after {formatINR(analysisResult.incomeSummary.taxDeduction)} TDS. The effective monthly tax burden is 17.62%. Statutory EPF creates ₹1.22L in annual non-market sovereign assets.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setGeneratedReportOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
