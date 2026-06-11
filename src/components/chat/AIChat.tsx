"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/shared/UserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ChatMessage } from "./ChatMessage";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function sendMessage(text?: string) {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your Gemini API key is set in the environment variables.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-stone-200 bg-white px-4 py-3 md:px-6 dark:border-dark-border dark:bg-dark-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-lg">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink dark:text-white">
                AI Manager
              </h1>
              <p className="text-xs text-ink-tertiary dark:text-stone-500">
                Ask anything about your sales data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
            >
              ← POS
            </Link>
            <Link
              href="/reports"
              className="hidden rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-ink-secondary hover:bg-stone-50 sm:block dark:border-dark-border dark:text-stone-400 dark:hover:bg-dark-hover"
            >
              📊 Reports
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 dark:bg-purple-900/30">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-xl font-bold text-ink dark:text-white">
                Hi! I&apos;m your AI Manager
              </h2>
              <p className="mt-2 max-w-md text-center text-sm text-ink-secondary dark:text-stone-400">
                I can answer questions about your sales, revenue, top items,
                busiest hours, and more. I have access to your real order data.
              </p>
              <SuggestedQuestions onSelect={sendMessage} />
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <span className="text-sm">🤖</span>
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm border border-stone-100 dark:border-dark-border dark:bg-dark-card">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your sales data..."
            rows={1}
            className="w-full flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-ink placeholder-ink-tertiary outline-none transition-colors focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100 dark:border-dark-border dark:bg-dark-input dark:text-white dark:placeholder-stone-500 dark:focus:border-purple-600 dark:focus:bg-dark-surface dark:focus:ring-purple-900/30"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-purple-600 text-white transition-colors hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
              />
            </svg>
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-ink-tertiary dark:text-stone-600">
          Powered by Google Gemini · Answers based on your real order data
        </p>
      </div>
    </div>
  );
}
