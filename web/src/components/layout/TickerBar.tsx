"use client";

export function TickerBar() {
  const messages = [
    "ウラドリ — 視聴者とAIが語る、放送のウラ側",
    "放送情報・未放送素材・公開データから、ソラジローAIがお答えします",
    "あなたの声が、AI対話を動かす",
    "ウラドリ — 視聴者とAIが語る、放送のウラ側",
    "放送情報・未放送素材・公開データから、ソラジローAIがお答えします",
    "あなたの声が、AI対話を動かす",
  ];

  return (
    <footer className="relative z-10 overflow-hidden border-t border-[var(--glass-border)]"
      style={{ background: "linear-gradient(180deg, rgba(6,13,26,0.98) 0%, rgba(12,24,41,0.95) 100%)" }}
    >
      {/* Top glow line */}
      <div className="glow-line" />

      <div className="flex items-center h-9">
        {/* Label */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 h-full bg-[var(--red-primary)] text-white text-[11px] font-bold tracking-wider"
          style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 100%, 0 100%)" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-80">
            <polygon points="0,0 10,5 0,10" fill="currentColor" />
          </svg>
          NEWS
        </div>

        {/* Scrolling ticker */}
        <div className="flex-1 overflow-hidden ml-2">
          <div className="ticker-track whitespace-nowrap">
            {messages.map((msg, i) => (
              <span
                key={i}
                className="inline-block px-8 text-[12px] text-[var(--text-secondary)] tracking-wide"
              >
                {msg}
                <span className="inline-block mx-6 text-[var(--text-muted)]">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
