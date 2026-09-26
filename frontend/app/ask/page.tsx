"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ALL_AGENTS } from "@/lib/mock/agents";
import { Agent, AgentId } from "@/types/agent";

import { AskFinOSComposer } from "@/components/ask-finos/AskFinOSComposer";
import { AgentSidebar, Thread } from "@/components/ask-finos/AgentSidebar";
import { AgentSelectorGrid } from "@/components/ask-finos/AgentSelectorGrid";
import { AgentDetailModal } from "@/components/ask-finos/AgentDetailModal";
import { AgentWorkspacePanel } from "@/components/ask-finos/AgentWorkspacePanel";
import { FinOSResponseBubble, ConversationMessage } from "@/components/ask-finos/FinOSResponseBubble";
import { ThinkingState } from "@/components/ask-finos/ThinkingState";
import { SuggestedPromptsHero } from "@/components/ask-finos/SuggestedPromptsHero";

import { analysisApi, adapterFinosStateToConversationMessage } from "@/lib/api/analysis";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { FinOSApiError } from "@/lib/api/client";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Loader2,
  ShieldCheck,
  Search,
  Layers,
  ChevronRight,
  ShieldAlert,
  Lock,
} from "lucide-react";

interface FullThread extends Thread {
  messages: ConversationMessage[];
}

type ViewState = "initial" | "searched" | "agent";

function AskFinOSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const initialQuery = searchParams.get("q") || "";

  // View State for Search-First Workspace: "initial" | "searched" | "agent"
  const [viewState, setViewState] = useState<ViewState>(initialQuery ? "searched" : "initial");
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialQuery);

  // Clean Threads State (no mock conversations)
  const [threads, setThreads] = useState<FullThread[]>([
    {
      id: "t-default",
      title: "New Financial Inquiry",
      time: "Just now",
      messages: [],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState("t-default");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [inspectModalAgent, setInspectModalAgent] = useState<Agent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [composerInitialText, setComposerInitialText] = useState(initialQuery);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentThread = threads.find((t) => t.id === activeThreadId) || threads[0] || {
    id: "t-default",
    title: "New Financial Inquiry",
    time: "Just now",
    messages: [],
  };

  // Auto scroll message stream to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentThread?.messages, isProcessing]);

  // Handle agent selection from sidebar or grid
  const handleSelectAgent = (agent: Agent | null) => {
    setSelectedAgent(agent);
    if (agent) {
      setViewState("agent");
    } else {
      setViewState(currentThread.messages.length > 0 ? "searched" : "initial");
    }
  };

  const handleNewThread = () => {
    const newId = `t-${Date.now()}`;
    const newThread: FullThread = {
      id: newId,
      title: "New Financial Inquiry",
      time: "Just now",
      messages: [],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newId);
    setSelectedAgent(null);
    setViewState("initial");
    setActiveSearchQuery("");
  };

  // Main message send handler connected to real FastAPI /analysis endpoint
  const handleSendMessage = async ({
    message,
    deepReasoning,
    attachments,
    selectedAgentId,
  }: {
    message: string;
    deepReasoning: boolean;
    attachments: Array<{ name: string; type: string }>;
    selectedAgentId?: AgentId | null;
  }) => {
    if (!message.trim() || isProcessing) return;

    setActiveSearchQuery(message);
    if (viewState === "initial") {
      setViewState("searched");
    }

    const userMsg: ConversationMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: attachments.length > 0
        ? `${message} [Attached: ${attachments.map((a) => a.name).join(", ")}]`
        : message,
      timestamp: "Just now",
    };

    const updatedMessages = [...currentThread.messages, userMsg];

    // Update title if first message
    const threadTitle = currentThread.messages.length === 0
      ? message.length > 28 ? `${message.substring(0, 28)}...` : message
      : currentThread.title;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, title: threadTitle, messages: updatedMessages }
          : t
      )
    );

    setIsProcessing(true);

    try {
      // Find last resolved entity in the active thread to preserve context for follow-ups
      const lastFinosMsg = [...currentThread.messages].reverse().find((m) => m.sender === "finos" && m.entity_id);
      
      const contextPayload: Record<string, any> = {};
      if (selectedAgentId) {
        contextPayload.selected_agent_id = selectedAgentId;
      }

      // Execute REAL FinOS 10-agent engine via FastAPI backend
      const stateResponse = await analysisApi.runAnalysis({
        request: message,
        entity_id: lastFinosMsg?.entity_id,
        context: contextPayload,
      });

      const finosMsg = adapterFinosStateToConversationMessage(stateResponse, deepReasoning);

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...updatedMessages, finosMsg] }
            : t
        )
      );
    } catch (err: any) {
      let isAuthError = false;
      let errorText = "An error occurred while communicating with the FinOS 10-agent engine.";

      if (err instanceof FinOSApiError || typeof err?.status === "number") {
        const status = err.status;
        if (status === 401) {
          isAuthError = true;
          errorText = "Authentication required. Please sign in to your FinOS account to execute real 10-agent financial analysis.";
        } else if (status === 422) {
          errorText = `Request validation error (422): ${err.message || "Invalid financial query parameters."}`;
        } else if (status >= 500) {
          errorText = `FinOS core service error (${status}): ${err.message || "The 10-agent engine encountered an issue during execution."}`;
        } else if (status === 0) {
          errorText = "Unable to connect to FinOS backend service. Ensure the FastAPI server is operational on port 8000.";
        } else {
          errorText = err.message || errorText;
        }
      } else if (err?.message) {
        errorText = err.message;
      }

      const errorMsg: ConversationMessage = {
        id: `err-${Date.now()}`,
        sender: "finos",
        text: errorText,
        timestamp: "Just now",
        isAuthError,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...updatedMessages, errorMsg] }
            : t
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenAgentWorkspace = (agentId: AgentId) => {
    const ag = ALL_AGENTS.find((a) => a.id === agentId);
    if (ag) {
      setSelectedAgent(ag);
      setViewState("agent");
    }
  };

  const handleStartAgentChat = (agent: Agent, query?: string) => {
    setSelectedAgent(agent);
    setViewState("agent");
    if (query) {
      handleSendMessage({
        message: query,
        deepReasoning: false,
        attachments: [],
        selectedAgentId: agent.id,
      });
    }
  };

  const hasMessages = currentThread.messages.length > 0;

  return (
    <AppShell
      headerTitle="Ask FinOS Workspace"
      headerSubtitle="Conversational Multi-Agent Financial Intelligence System"
    >
      <div className="bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[650px]">
        {/* Left Sidebar: Inquiry Threads & FinOS 10 Agents Navigation */}
        <AgentSidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={(id) => {
            setActiveThreadId(id);
            const target = threads.find((t) => t.id === id);
            if (target && target.messages.length > 0) {
              setViewState("searched");
            } else if (!selectedAgent) {
              setViewState("initial");
            }
          }}
          onNewThread={handleNewThread}
          selectedAgentId={selectedAgent?.id || null}
          onSelectAgent={handleSelectAgent}
        />

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col justify-between h-full min-w-0 bg-white dark:bg-[#0c1222] relative overflow-hidden">
          {/* Workspace Header Top Bar */}
          <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-4 shrink-0 z-10 transition-all duration-300">
            {/* Left: View State Badge / Back Button */}
            {viewState === "agent" && selectedAgent ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewState(hasMessages ? "searched" : "initial")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Chat</span>
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedAgent.accentColor }}
                  />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {selectedAgent.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-500">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                  {currentThread.title || "Ask FinOS Conversational Workspace"}
                </span>
              </div>
            )}

            {/* Right Top Area: New Thread Button */}
            <button
              type="button"
              onClick={handleNewThread}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Inquiry</span>
            </button>
          </div>

          {/* Main Content Body */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* 1. INITIAL STATE: Dominant Welcome Screen */}
            {viewState === "initial" && !hasMessages && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-500">
                {!authLoading && !isAuthenticated && (
                  <div className="mb-6 w-full max-w-2xl mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs font-medium shadow-2xs">
                    <div className="flex items-center gap-2.5 text-left">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Please sign in to your account to execute real 10-agent FinOS analysis.</span>
                    </div>
                    <Link
                      href="/login"
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition shadow-2xs"
                    >
                      Sign In
                    </Link>
                  </div>
                )}

                {/* Brand Hero Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Ask FinOS — Search-First Multi-Agent Financial Intelligence</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white max-w-3xl leading-tight">
                  Ask anything about your finances
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2 mb-8 max-w-xl leading-relaxed">
                  Ask questions about equities, credit solvency, risk levels, portfolio limits, macro context, or tax implications.
                </p>

                {/* Centered Initial Composer */}
                <div className="w-full max-w-3xl mx-auto">
                  <AskFinOSComposer
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                    selectedAgent={selectedAgent}
                    placeholder="Tell me about Coal India, RELIANCE, TCS..."
                    initialText={composerInitialText}
                  />
                </div>
              </div>
            )}

            {/* 2. CHAT CONVERSATION STATE: Continuous Chat Stream + Bottom Docked Composer */}
            {(viewState === "searched" || hasMessages) && viewState !== "agent" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Scrollable Conversation History */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
                  {currentThread.messages.map((msg) => (
                    <FinOSResponseBubble
                      key={msg.id}
                      message={msg}
                      onOpenAgent={handleOpenAgentWorkspace}
                    />
                  ))}

                  {isProcessing && <ThinkingState />}

                  <div ref={messagesEndRef} />
                </div>

                {/* Bottom Fixed/Docked Input Composer for Continuous Follow-ups */}
                <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                  <AskFinOSComposer
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                    selectedAgent={selectedAgent}
                    placeholder="Ask a follow-up question..."
                  />
                </div>
              </div>
            )}

            {/* 3. SAME-PAGE AGENT WORKSPACE */}
            {viewState === "agent" && selectedAgent && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AgentWorkspacePanel
                  agent={selectedAgent}
                  onBack={() => setViewState(hasMessages ? "searched" : "initial")}
                  onInvolveAgents={(suggestedQuery) => {
                    handleSendMessage({
                      message: suggestedQuery,
                      deepReasoning: true,
                      attachments: [],
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent Detail Modal Drawer when inspecting an agent directly */}
      <AgentDetailModal
        agent={inspectModalAgent}
        onClose={() => setInspectModalAgent(null)}
        onStartAgentChat={handleStartAgentChat}
      />
    </AppShell>
  );
}

export default function AskFinOSPage() {
  return (
    <Suspense
      fallback={
        <AppShell headerTitle="Ask FinOS Workspace">
          <div className="h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              <span className="text-xs font-mono text-slate-400">
                Loading Search-First Multi-Agent Workspace...
              </span>
            </div>
          </div>
        </AppShell>
      }
    >
      <AskFinOSContent />
    </Suspense>
  );
}

