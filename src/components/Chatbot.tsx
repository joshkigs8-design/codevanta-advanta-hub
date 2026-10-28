"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import SheepAvatar from "@/components/SheepAvatar";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const initialMessage: ChatMessage = {
  role: "assistant",
  content: "Hi, I’m Woolly. Ask me about developer resources, APIs, guides, or membership.",
};

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
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

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      {isOpen && (
        <section
          aria-label="CodeVanta assistant"
          className="mb-3 flex h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-hub-surface shadow-2xl shadow-black/50"
        >
          <header className="flex items-center justify-between border-b border-hub-border bg-hub-surface-elevated px-4 py-3">
            <div className="flex items-center gap-3">
              <SheepAvatar className="h-10 w-10" />
              <div>
                <h2 className="text-sm font-bold text-white">Woolly</h2>
                <p className="text-[11px] text-hub-text-muted">CodeVanta assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-2 text-hub-text-muted hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-2 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && <SheepAvatar className="h-7 w-7 shrink-0" />}
                <p
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-hub-gold text-white"
                      : "rounded-bl-sm bg-hub-surface-elevated text-hub-text-secondary"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-hub-text-muted">
                <SheepAvatar className="h-7 w-7" />
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Woolly is thinking...
              </div>
            )}
            {error && <p className="rounded-lg border border-red-500/30 bg-red-950/30 p-2 text-xs text-red-300">{error}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-hub-border p-3">
            <div className="flex items-center gap-2 rounded-xl border border-hub-border bg-hub-surface-elevated p-1.5 focus-within:border-hub-gold">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Woolly anything..."
                maxLength={1000}
                aria-label="Message Woolly"
                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder:text-hub-text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="rounded-lg bg-hub-gold p-2 text-white hover:bg-hub-gold-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Woolly chat" : "Open Woolly chat"}
        className="ml-auto flex items-center gap-2 rounded-full border border-white/15 bg-hub-surface-elevated p-1.5 pr-4 text-xs font-semibold text-white shadow-xl shadow-black/30 hover:border-hub-gold/60 hover:bg-hub-surface"
      >
        <SheepAvatar className="h-10 w-10" />
        <span className="hidden sm:inline">{isOpen ? "Close chat" : "Chat with Woolly"}</span>
        {!isOpen && <MessageCircle className="h-4 w-4 text-hub-gold" />}
      </button>
    </div>
  );
}
