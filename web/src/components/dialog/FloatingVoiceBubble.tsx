"use client";

import { useEffect, useState } from "react";

type BubbleItem = {
  id: string;
  text: string;
  x: number;
  y: number;
  delay: number;
};

export function FloatingVoiceBubbles({
  texts,
}: {
  texts: string[];
}) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);

  useEffect(() => {
    if (texts.length === 0) return;
    const latest = texts[texts.length - 1];
    const bubble: BubbleItem = {
      id: `${Date.now()}-${Math.random()}`,
      text: latest.length > 40 ? latest.slice(0, 40) + "…" : latest,
      x: 5 + Math.random() * 70,
      y: 10 + Math.random() * 50,
      delay: 0,
    };
    setBubbles((prev) => [...prev.slice(-6), bubble]);

    const timer = setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, 8000);
    return () => clearTimeout(timer);
  }, [texts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute floating-bubble"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
          }}
        >
          <div className="glass-panel-bright px-3 py-2 max-w-[200px]">
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {bubble.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
