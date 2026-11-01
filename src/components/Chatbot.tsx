"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X, Copy, Check, Sparkles } from "lucide-react";
import SheepAvatar from "@/components/SheepAvatar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const initialMessage: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm Woolly, your CodeVanta Hub AI guide. Ask me about developer resources, membership plans, M-Pesa payments, or our 2-Tier referral rewards.",
};

const quickPrompts = [
  "🎁 How to earn with Referrals",
  "Membership plans & pricing",
  "How to pay with M-Pesa",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(textToSend: string) {
    const content = textToSend.trim();
    if (!content || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || !data.message) {
        throw new Error(data.error || "The assistant could not respond.");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.message! }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant could not respond.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(input);
  }

  return (
    <div
      className={
        isOpen
          ? "fixed inset-0 z-50 flex flex-col justify-end p-2 sm:p-0 sm:inset-auto sm:bottom-7 sm:right-7 pointer-events-none"
          : "fixed bottom-4 right-4 z-50 sm:bottom-7 sm:right-7"
      }
    >
      {isOpen && (
        <section
          aria-label="CodeVanta assistant"
          className="pointer-events-auto flex flex-col h-[calc(100dvh-1rem)] sm:h-[min(650px,calc(100vh-6rem))] w-full sm:w-[460px] md:w-[480px] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-hub-surface shadow-2xl shadow-black/80 backdrop-blur-xl animate-fadeIn"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-hub-border bg-hub-surface-elevated px-3.5 py-2.5 sm:px-4 sm:py-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <SheepAvatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-hub-gold/50 shadow-md shrink-0" />
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                  <span>Woolly</span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full bg-hub-gold/20 text-hub-gold font-semibold border border-hub-gold/30">
                    AI Mascot
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-hub-text-muted">CodeVanta Hub Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-2 text-hub-text-muted hover:bg-white/10 hover:text-white transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Messages Container */}
          <div className="flex-1 space-y-3 sm:space-y-3.5 overflow-y-auto p-3 sm:p-4 scrollbar-thin overscroll-contain min-h-0">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-2 sm:gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <SheepAvatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 mt-0.5 ring-1 ring-hub-gold/40 shadow-sm" />
                )}

                {message.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-hub-gold px-3 sm:px-3.5 py-2 text-xs font-medium text-white shadow-md break-words whitespace-pre-wrap select-text">
                    {message.content}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 max-w-[92%] sm:max-w-[88%] min-w-0">
                    <div className="rounded-2xl rounded-bl-sm bg-hub-surface-elevated border border-white/10 px-3 py-2.5 sm:px-3.5 sm:py-3 text-xs text-hub-text-secondary shadow-lg overflow-hidden select-text min-w-0">
                      <MarkdownRenderer content={message.content} variant="chat" />
                    </div>
                    {/* Discreet Copy Answer Action */}
                    <div className="flex items-center justify-end px-1">
                      <CopyResponseButton text={message.content} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-hub-gold/90 font-mono bg-hub-gold/10 border border-hub-gold/20 px-3 py-2 rounded-xl w-fit">
                <SheepAvatar className="h-5 w-5 shrink-0" />
                <Loader2 className="h-3.5 w-3.5 animate-spin text-hub-gold shrink-0" />
                <span>Woolly is drafting an answer...</span>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300 break-words">
                {error}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Chips (Shown when initial greeting is displayed) */}
          {messages.length === 1 && !isLoading && (
            <div className="px-3 py-2 sm:px-4 bg-black/30 border-t border-white/5 shrink-0">
              <span className="text-[10px] font-mono text-hub-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-hub-gold shrink-0" />
                Suggested questions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-[11px] px-2.5 py-1.5 min-h-[28px] rounded-lg bg-white/5 hover:bg-white/10 hover:border-hub-gold/50 border border-white/10 text-white/90 transition-all active:scale-95 touch-manipulation"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-hub-border p-2.5 sm:p-3 bg-hub-surface-elevated/40 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-surface-elevated p-1 focus-within:border-hub-gold transition-colors">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Woolly about CodeVanta..."
                maxLength={1000}
                aria-label="Message Woolly"
                className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-[14px] sm:text-xs text-white placeholder:text-hub-text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="rounded-lg bg-hub-gold p-2 sm:p-2.5 text-white hover:bg-hub-gold-hover disabled:cursor-not-allowed disabled:opacity-40 transition-all active:scale-95 shadow-md min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center shrink-0 touch-manipulation"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Floating Toggle Button (Hidden on small mobile when modal is already open) */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Woolly chat" : "Open Woolly chat"}
        className={`pointer-events-auto ml-auto items-center gap-2.5 rounded-full border border-hub-gold/40 bg-hub-surface-elevated/95 p-1.5 pr-4 text-xs font-semibold text-white shadow-2xl shadow-black/60 hover:border-hub-gold hover:bg-hub-surface active:scale-95 transition-all backdrop-blur-md touch-manipulation ${
          isOpen ? "hidden sm:flex" : "flex"
        }`}
      >
        <SheepAvatar className="h-9 w-9 sm:h-10 sm:w-10 ring-2 ring-hub-gold/50 shrink-0" />
        <span className="hidden sm:inline">{isOpen ? "Close chat" : "Chat with Woolly"}</span>
        {!isOpen && <MessageCircle className="h-4 w-4 text-hub-gold animate-pulse shrink-0" />}
      </button>
    </div>
  );
}

function CopyResponseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy answer"
      aria-label="Copy assistant response"
      className="inline-flex items-center gap-1 text-[10px] text-hub-text-muted hover:text-white transition-colors py-0.5 px-1.5 min-h-[26px] rounded hover:bg-white/5 active:scale-95 touch-manipulation"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-400" />
          <span className="text-emerald-400 font-mono">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 opacity-60" />
          <span className="font-mono">Copy answer</span>
        </>
      )}
    </button>
  );
}
