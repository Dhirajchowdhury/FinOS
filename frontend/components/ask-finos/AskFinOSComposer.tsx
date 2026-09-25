"use client";

import React, { useState, useRef, useEffect } from "react";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";
import {
  Send,
  Plus,
  Mic,
  MicOff,
  Sparkles,
  Paperclip,
  FileText,
  PieChart,
  Table,
  Receipt,
  HelpCircle,
  X,
  Brain,
  Check,
  Bot,
} from "lucide-react";

interface AskFinOSComposerProps {
  onSendMessage: (payload: {
    message: string;
    deepReasoning: boolean;
    attachments: Array<{ name: string; type: string }>;
    selectedAgentId?: AgentId | null;
  }) => void;
  isProcessing: boolean;
  selectedAgent?: Agent | null;
  placeholder?: string;
  initialText?: string;
  compact?: boolean;
}

export function AskFinOSComposer({
  onSendMessage,
  isProcessing,
  selectedAgent,
  placeholder,
  initialText = "",
  compact = false,
}: AskFinOSComposerProps) {
  const [text, setText] = useState(initialText);
  const [deepReasoning, setDeepReasoning] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string }>>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Handle click outside plus menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-resize text area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        compact ? 100 : 180
      )}px`;
    }
  }, [text, compact]);

  // Handle @ agent mention trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const lastWord = val.split(/\s+/).pop() || "";
    if (lastWord.startsWith("@")) {
      setShowMentionMenu(true);
      setMentionFilter(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentionMenu(false);
    }
  };

  const selectMentionAgent = (agent: Agent) => {
    const words = text.split(/\s+/);
    words.pop(); // remove incomplete @mention
    const newText = [...words, `@${agent.name.replace(/\s+/g, "")}`].join(" ") + " ";
    setText(newText);
    setShowMentionMenu(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  // Microphone Voice Input handling via Browser Web Speech API
  const toggleVoiceInput = () => {
    setVoiceError(null);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please type your query.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setVoiceError(`Voice input error: ${event.error || "Unable to transcribe"}`);
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceError("Failed to access microphone.");
      setTimeout(() => setVoiceError(null), 4000);
    }
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isProcessing) return;

    onSendMessage({
      message: text.trim(),
      deepReasoning,
      attachments,
      selectedAgentId: selectedAgent?.id,
    });

    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSimulatedFileUpload = (name: string, type: string) => {
    setAttachments((prev) => [...prev, { name, type }]);
    setIsPlusMenuOpen(false);
  };

  const filteredMentionAgents = ALL_AGENTS.filter((a) =>
    a.name.toLowerCase().includes(mentionFilter) || a.id.toLowerCase().includes(mentionFilter)
  );

  return (
    <div
      className={`relative w-full transition-all duration-300 ${
        compact ? "max-w-[420px] ml-auto space-y-1" : "max-w-4xl mx-auto space-y-2"
      }`}
    >
      {/* Voice Error Banner */}
      {voiceError && (
        <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Listening Active Indicator */}
      {isListening && (
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-[11px]">Listening to voice...</span>
          <button
            onClick={toggleVoiceInput}
            className="ml-auto text-[10px] underline font-bold"
          >
            Stop
          </button>
        </div>
      )}

      {/* Attached Files Pill Bar */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
            >
              <Paperclip className="w-3 h-3 text-emerald-500" />
              <span className="truncate max-w-[120px]">{att.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white ml-0.5"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Deep Reasoning Active Pill */}
      {deepReasoning && (
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-medium w-fit">
          <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span>Deep Reasoning Active</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-900/5 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all ${
          compact ? "shadow-xs" : "sm:rounded-3xl"
        }`}
      >
        {/* Top / Input Field */}
        <div className={compact ? "p-2.5" : "p-3 sm:p-4"}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            rows={1}
            placeholder={
              placeholder ||
              (selectedAgent
                ? `Ask ${selectedAgent.name}...`
                : "Ask portfolio, markets, taxes, risk...")
            }
            className={`w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed ${
              compact
                ? "text-xs min-h-[36px] max-h-[100px]"
                : "text-sm sm:text-base min-h-[44px] max-h-[180px]"
            }`}
          />
        </div>

        {/* Bottom Toolbar */}
        <div
          className={`flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl ${
            compact ? "px-2.5 py-1.5" : "px-3 sm:px-4 py-2 sm:rounded-b-3xl"
          }`}
        >
          {/* Left Controls: Plus Attachment & Secondary Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Plus Attachment Button */}
            <div className="relative" ref={plusMenuRef}>
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={`p-1.5 rounded-lg border text-slate-600 dark:text-slate-300 transition-colors ${
                  isPlusMenuOpen
                    ? "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                aria-label="Upload or attach document"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {/* Attachment Dropdown Menu */}
              {isPlusMenuOpen && (
                <div className="absolute left-0 bottom-10 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                    Attach Financial Context
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload("Financial_Report_Q3.pdf", "pdf")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Upload Financial Document</div>
                      <div className="text-[9px] text-slate-400">PDF, Annual reports</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload("Portfolio_Holdings_Sep.csv", "csv")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <PieChart className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Upload Portfolio Statement</div>
                      <div className="text-[9px] text-slate-400">Broker statements, holding export</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload("Bank_Transactions_2026.csv", "csv")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Table className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Upload Transaction CSV</div>
                      <div className="text-[9px] text-slate-400">Bank feeds, wire records</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatedFileUpload("Tax_Form_16A.pdf", "pdf")}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-semibold text-[11px]">Upload Tax Document</div>
                      <div className="text-[9px] text-slate-400">ITR receipts, Form 16</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Think Toggle Control */}
            <button
              type="button"
              onClick={() => setDeepReasoning(!deepReasoning)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                deepReasoning
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              aria-label="Toggle Think deep reasoning mode"
            >
              <Brain className={`w-3 h-3 ${deepReasoning ? "animate-pulse" : "text-purple-500"}`} />
              <span>Think</span>
            </button>

            {/* Microphone Voice Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                isListening
                  ? "bg-rose-600 text-white border-rose-600 animate-pulse shadow-xs"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              aria-label="Voice microphone input"
            >
              {isListening ? (
                <MicOff className="w-3 h-3" />
              ) : (
                <Mic className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              )}
              <span className={compact ? "hidden sm:inline" : "inline"}>
                {isListening ? "Listening..." : "Mic"}
              </span>
            </button>
          </div>

          {/* Right: Send Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!text.trim() || isProcessing}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40 disabled:hover:bg-emerald-600 transition shadow-xs cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* @ Mention Suggestion Popover */}
      {showMentionMenu && (
        <div className="absolute left-4 bottom-20 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in max-h-60 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            Mention Specialized Agent
          </div>
          {filteredMentionAgents.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No agent matching "@{mentionFilter}"</div>
          ) : (
            filteredMentionAgents.map((ag) => (
              <button
                key={ag.id}
                type="button"
                onClick={() => selectMentionAgent(ag)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.accentColor }} />
                  <span className="font-bold text-slate-900 dark:text-white">{ag.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{ag.category}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


