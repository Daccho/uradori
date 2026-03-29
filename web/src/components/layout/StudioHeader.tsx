"use client";

import { useEffect, useState } from "react";

export function StudioHeader() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-[var(--glass-border)]"
      style={{ background: "linear-gradient(180deg, rgba(12,24,41,0.95) 0%, rgba(6,13,26,0.98) 100%)" }}
    >
      {/* Left: ON AIR + Logo */}
      <div className="flex items-center gap-4">
        {/* ON AIR badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[rgba(230,57,70,0.12)] border border-[rgba(230,57,70,0.3)]">
          <span className="on-air-dot" />
          <span
            className="text-[11px] font-bold tracking-[0.2em] text-[var(--red-primary)]"
            style={{ fontFamily: "var(--font-share-tech), monospace" }}
          >
            ON AIR
          </span>
        </div>

        {/* Logo */}
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
            ウラドリ
          </h1>
          <span className="hidden sm:inline text-[11px] text-[var(--text-muted)] tracking-wide">
            放送のウラ側、お届けします
          </span>
        </div>
      </div>

      {/* Right: Time display */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--text-muted)] tracking-wider uppercase"
          style={{ fontFamily: "var(--font-share-tech), monospace" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: "status-blink 2s ease-in-out infinite" }} />
          SYSTEM ACTIVE
        </div>
        <div
          className="px-3 py-1 rounded bg-[var(--bg-card)] border border-[var(--glass-border)] text-sm tabular-nums text-[var(--cyan-primary)]"
          style={{ fontFamily: "var(--font-share-tech), monospace" }}
        >
          {time || "--:--:--"}
        </div>
      </div>
    </header>
  );
}
