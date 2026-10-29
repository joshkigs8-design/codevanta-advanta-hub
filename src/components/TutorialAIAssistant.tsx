"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TutorialAIAssistantProps {
  tutorialTitle: string;
  category: string;
  summary: string;
}

export default function TutorialAIAssistant({
  tutorialTitle,
  category,
  summary,
}: TutorialAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm your AI guide for **"${tutorialTitle}"**. Ask me anything about hardware compatibility, syntax, errors, or troubleshooting.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Can I run this on 8GB RAM without GPU?",
    "Explain the core terminal commands step-by-step",
    "What are the most common errors for this setup?",
    "How does local AI compare to cloud API pricing?",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async (userQuestion?: string) => {
    const textToSend = userQuestion || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: "user", content: textToSend.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!userQuestion) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `[Context: The user is currently reading the CodeVanta Hub tutorial "${tutorialTitle}" in category "${category}". Summary: "${summary}"]\n\nQuestion: ${textToSend}`,
            },
          ],
        }),
      });

      const data = await response.json();
      if (response.ok && data.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              data.error ||
              "I encountered an error querying the assistant service. Please check your network connection or verify local prerequisites.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to contact the AI assistant service. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="ai-assistant-panel rounded-2xl bg-hub-surface-card border border-hub-gold/30 shadow-2xl overflow-hidden transition-all">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-hub-gold/20 via-black/40 to-transparent border-b border-white/10 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-hub-gold/20 border border-hub-gold/40 flex items-center justify-center text-hub-gold shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>CodeVanta AI Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                Online
              </span>
            </h3>
            <p className="text-[11px] text-hub-text-muted">Interactive companion for this guide</p>
          </div>
        </div>

        <button
          className="p-1 rounded text-hub-text-muted hover:text-white transition-colors"
          aria-label="Toggle AI Assistant"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Quick Questions Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-hub-text-muted flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-hub-gold" />
              Quick Questions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:border-hub-gold/40 border border-white/5 text-white/85 transition-all active:scale-95 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Log */}
          <div className="max-h-72 overflow-y-auto space-y-3 p-2 rounded-xl bg-black/40 border border-white/5 text-xs font-sans scrollbar-thin">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-md bg-hub-gold/20 text-hub-gold border border-hub-gold/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    m.role === "user"
                      ? "bg-hub-gold text-white font-medium shadow-md"
                      : "bg-hub-surface-elevated text-hub-text-secondary border border-white/10 whitespace-pre-wrap"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <div className="w-6 h-6 rounded-md bg-white/10 text-white border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-hub-gold p-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking with tutorial context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about RAM sizing, model flags, errors..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-hub-surface border border-white/10 text-xs text-white placeholder-hub-text-muted focus:outline-none focus:border-hub-gold transition-colors font-sans"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-hub-gold hover:bg-hub-gold-hover text-white transition-all disabled:opacity-40 disabled:hover:bg-hub-gold active:scale-95 shadow-md shrink-0"
              title="Send to AI Assistant"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
