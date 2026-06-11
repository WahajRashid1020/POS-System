"use client";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  {
    icon: "📊",
    text: "How are sales doing today?",
  },
  {
    icon: "🏆",
    text: "What are the top 5 best selling items this week?",
  },
  {
    icon: "⏰",
    text: "What's our busiest hour?",
  },
  {
    icon: "💳",
    text: "Compare cash vs card payments",
  },
  {
    icon: "📈",
    text: "How does this week compare to last month's average?",
  },
  {
    icon: "🍔",
    text: "Which food category brings the most revenue?",
  },
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="mt-8 w-full max-w-lg">
      <p className="mb-3 text-center text-xs font-medium text-ink-tertiary uppercase tracking-wide">
        Try asking
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSelect(s.text)}
            className="flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm text-ink-secondary transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-ink"
          >
            <span className="text-base">{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
