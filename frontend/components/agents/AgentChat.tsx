"use client";

import React, { useState } from "react";
import { Agent, AgentMessage } from "@/types/agent";
import { Send, Bot, User, ChevronDown, ChevronUp, Sparkles, ArrowRight, ShieldCheck, Database, Wrench } from "lucide-react";
import { agentsApi } from "@/lib/api/agents";

interface AgentChatProps {
  agent: Agent;
  onInvolveAgents?: (suggestedQuery: string) => void;
}

export function AgentChat({ agent, onInvolveAgents }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "init",
      agentId: agent.id,
      sender: "agent",
      content: `Hello, I am the **${agent.name}**. I evaluate market telemetry, quantitative factor loadings, and regulatory parameters using FinOS GraphRAG memory.\n\nHow can I assist your financial decision-making today?`,
      timestamp: "Just now",
      status: "completed",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isThinking) return;

    const userMsg: AgentMessage = {
      id: `usr-${Date.now()}`,
      agentId: agent.id,
      sender: "user",
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    try {
      const agentReply = await agentsApi.queryAgent(agent.id, query.trim());
      setMessages((prev) => [...prev, agentReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          agentId: agent.id,
          sender: "agent",
          content: "Encountered a momentary reconciliation latency. Please re-submit your query.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "error",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleDetails = (msgId: string) => {
    setExpandedDetailsId(expandedDetailsId === msgId ? null : msgId);
  };

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : `${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text} border ${agent.color.borderLight} ${agent.color.borderDark}`
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/70 dark:border-slate-700/60"
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">{msg.content}</div>

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] mt-1.5 ${
                      isUser ? "text-emerald-200 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Collapsible Analysis Details */}
                {msg.analysisDetails && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleDetails(msg.id)}
                      className="w-full flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>View Analysis Details & Guardrails</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                          ({msg.analysisDetails.confidenceScore}% Confidence)
                        </span>
                      </div>
                      {expandedDetailsId === msg.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedDetailsId === msg.id && (
                      <div className="p-3 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        {/* Tools Used */}
                        {msg.analysisDetails.toolsUsed && (
                          <div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              <Wrench className="w-3 h-3" /> Tools & Factor Models
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.analysisDetails.toolsUsed.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Data Sources */}
                        {msg.analysisDetails.dataSources && (
                          <div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              <Database className="w-3 h-3" /> Real-time Data Feeds
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.analysisDetails.dataSources.map((s, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reasoning Steps */}
                        {msg.analysisDetails.reasoningSteps && (
                          <div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              <ShieldCheck className="w-3 h-3" /> Reasoning Chain
                            </span>
                            <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                              {msg.analysisDetails.reasoningSteps.map((step, i) => (
                                <li key={i}>{step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Option to involve other agents */}
                {msg.result?.collaboratingAgents && onInvolveAgents && (
                  <button
                    type="button"
                    onClick={() => onInvolveAgents(msg.content)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Involve Other Agents in Multi-Agent Pipeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${agent.color.bgLight} ${agent.color.bgDark} ${agent.color.text}`}
            >
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>{agent.name} is traversing GraphRAG knowledge bases...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts Bar */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider px-1">
          Suggestions:
        </span>
        {agent.samplePrompts.map((promptText, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(promptText)}
            disabled={isThinking}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Chat Input Composer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${agent.name}...`}
            disabled={isThinking}
            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="absolute right-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center justify-center transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
