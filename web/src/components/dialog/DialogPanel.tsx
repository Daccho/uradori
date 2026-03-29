"use client";

import { useEffect, useRef } from "react";
import type { DialogMessage } from "@/lib/types";
import { DialogBubble } from "./DialogBubble";

export function DialogPanel({
  messages,
  isStreaming,
}: {
  messages: DialogMessage[];
  isStreaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="glass-panel flex flex-col overflow-hidden flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--glass-border)] flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
          <path d="M1 3h12M1 7h8M1 11h10" />
        </svg>
        <span className="text-[11px] font-bold text-[var(--text-secondary)] tracking-wide">
          対話ログ
        </span>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="on-air-dot" style={{ width: 6, height: 6 }} />
            <span
              className="text-[10px] text-[var(--red-primary)] tracking-wider font-bold"
              style={{ fontFamily: "var(--font-share-tech), monospace" }}
            >
              LIVE
            </span>
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-xs">
            「対話開始」で AI 対話が始まります
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <DialogBubble key={i} message={msg} index={i} />
            ))}
            {isStreaming && messages.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-primary)] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-primary)] animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-primary)] animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">
                  応答を生成中...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
