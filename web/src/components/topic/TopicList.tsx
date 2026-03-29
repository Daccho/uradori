"use client";

import type { TopicItem } from "@/lib/types";
import { TopicCard } from "./TopicCard";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function groupByDate(topics: TopicItem[]): Map<string, TopicItem[]> {
  const grouped = new Map<string, TopicItem[]>();
  for (const topic of topics) {
    const date = topic.onair_date;
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(topic);
  }
  return grouped;
}

export function TopicList({ topics }: { topics: TopicItem[] }) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center fade-up">
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--bg-card)] border border-[var(--glass-border)] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          トピックがありません
        </p>
        <p className="text-[var(--text-muted)] text-xs mt-1">
          放送が始まるまでお待ちください
        </p>
      </div>
    );
  }

  const grouped = groupByDate(topics);
  let cardIndex = 0;

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([date, items]) => (
        <section key={date} className="fade-up" style={{ animationDelay: `${cardIndex * 40}ms` }}>
          {/* Date header — broadcast schedule style */}
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[var(--red-primary)] rounded-sm" />
              <h2 className="text-[13px] font-bold text-[var(--text-secondary)] tracking-wide">
                {formatDate(date)}
              </h2>
            </div>
            <div className="flex-1 h-px bg-[var(--glass-border)]" />
            <span className="text-[10px] text-[var(--text-muted)] tabular-nums"
              style={{ fontFamily: "var(--font-share-tech), monospace" }}
            >
              {items.length} TOPICS
            </span>
          </div>

          {/* Topic cards */}
          <div className="space-y-2">
            {items.map((topic) => {
              const idx = cardIndex++;
              return <TopicCard key={topic.id} topic={topic} index={idx} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
