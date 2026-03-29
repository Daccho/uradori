"use client";

import { useEffect, useState } from "react";
import { fetchTopics } from "@/lib/api-client";
import type { TopicItem } from "@/lib/types";
import { TopicList } from "@/components/topic/TopicList";

export default function HomePage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics()
      .then(setTopics)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      {/* Sub-header bar */}
      <div className="px-5 py-2.5 border-b border-[var(--glass-border)] bg-[var(--bg-panel)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
              <rect x="1" y="2" width="14" height="10" rx="1.5" />
              <path d="M5 14h6M8 12v2" />
            </svg>
            <span className="text-[12px] font-bold text-[var(--text-secondary)] tracking-wide">
              放送トピック
            </span>
          </div>
          <span
            className="text-[10px] text-[var(--text-muted)] tabular-nums"
            style={{ fontFamily: "var(--font-share-tech), monospace" }}
          >
            {!isLoading && !error ? `${topics.length} ITEMS` : "LOADING..."}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 fade-up">
              <div className="relative w-10 h-10 mb-4">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--glass-border)]" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--cyan-primary)] animate-spin" />
              </div>
              <p className="text-[var(--text-muted)] text-xs tracking-wider"
                style={{ fontFamily: "var(--font-share-tech), monospace" }}
              >
                LOADING TOPICS...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 fade-up">
              <div className="w-16 h-16 mb-4 rounded-full bg-[rgba(230,57,70,0.1)] border border-[rgba(230,57,70,0.2)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red-primary)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">
                データの取得に失敗しました
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">{error}</p>
            </div>
          ) : (
            <TopicList topics={topics} />
          )}
        </div>
      </div>
    </div>
  );
}
