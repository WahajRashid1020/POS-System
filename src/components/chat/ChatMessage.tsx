"use client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`mb-4 flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isUser ? "bg-brand-100 dark:bg-brand-900/40" : "bg-purple-100 dark:bg-purple-900/30"}`}
      >
        <span className="text-sm">{isUser ? "👤" : "🤖"}</span>
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "rounded-tr-sm bg-brand-500 text-white" : "rounded-tl-sm border border-stone-100 bg-white text-ink shadow-sm dark:border-dark-border dark:bg-dark-card dark:text-stone-200"}`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="space-y-2">
            {message.content.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              const formatted = line.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>",
              );
              return (
                <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
              );
            })}
          </div>
        )}

        <p
          className={`mt-1.5 text-[10px] ${isUser ? "text-white/60" : "text-ink-tertiary dark:text-stone-500"}`}
        >
          {new Date(message.timestamp).toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
