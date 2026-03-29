"use client";

import Link from "next/link";
import type { TopicItem } from "@/lib/types";

export function TopicCard({
  topic,
  index,
}: {
  topic: TopicItem;
  index: number;
}) {
  const timeRange =
    topic.corner_start_time && topic.corner_end_time
      ? `${topic.corner_start_time} - ${topic.corner_end_time}`
      : null;

  return (
    <Link
      href={`/dialog/${topic.id}`}
      className="telop-enter group relative block overflow-hidden rounded transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        animationDelay: `${index * 80}ms`,
        background: "var(--telop-gradient)",
      }}
    >
      {/* Red stripe */}
      <div className="telop-stripe" />

      {/* Glass border */}
      <div className="border border-[var(--glass-border)] rounded group-hover:border-[var(--glass-border-bright)] transition-colors duration-200">
        <div className="flex items-start gap-4 pl-5 pr-4 py-3.5">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug truncate group-hover:text-white transition-colors">
              {topic.headline}
            </h3>
            <div className="flex items-center gap-3 mt-1.5">
              {timeRange && (
                <span
                  className="text-[11px] text-[var(--cyan-primary)] tabular-nums"
                  style={{ fontFamily: "var(--font-share-tech), monospace" }}
                >
                  {timeRange}
                </span>
              )}
              {topic.headline_genre && (
                <span className="px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] rounded border border-[var(--glass-border)]">
                  {topic.headline_genre}
                </span>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded bg-[var(--bg-card)] border border-[var(--glass-border)] group-hover:border-[var(--cyan-primary)] group-hover:text-[var(--cyan-primary)] text-[var(--text-muted)] transition-all duration-200 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 3l4 4-4 4" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
