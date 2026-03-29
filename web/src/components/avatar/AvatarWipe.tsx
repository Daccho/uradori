"use client";

import type { Speaker } from "@/lib/types";

const AVATAR_CONFIG = {
  sorajiro: {
    name: "ソラジロー AI",
    role: "放送素材をもとに回答",
    color: "var(--cyan-primary)",
    glowColor: "rgba(0, 212, 255, 0.4)",
    borderColor: "rgba(0, 212, 255, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,212,255,0.02) 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 6V2M22 8l3-3M10 8L7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  audience: {
    name: "視聴者代表 AI",
    role: "視聴者の声を代弁",
    color: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.4)",
    borderColor: "rgba(34, 197, 94, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.02) 100%)",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 28c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="20" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <circle cx="22" cy="20" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
  },
};

export function AvatarWipe({
  currentSpeaker,
  isSpeaking,
}: {
  currentSpeaker: Speaker | null;
  isSpeaking: boolean;
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      {(["sorajiro", "audience"] as const).map((speaker) => {
        const config = AVATAR_CONFIG[speaker];
        const isActive = isSpeaking && currentSpeaker === speaker;

        return (
          <div
            key={speaker}
            className="flex-1 rounded overflow-hidden transition-all duration-300"
            style={{
              background: config.bgGradient,
              border: `1.5px solid ${isActive ? config.borderColor : "var(--glass-border)"}`,
              boxShadow: isActive
                ? `0 0 16px 2px ${config.glowColor}, inset 0 0 12px ${config.glowColor}`
                : "none",
              transform: isActive ? "scale(1.02)" : "scale(1)",
            }}
          >
            <div className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
              {/* Avatar icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-300"
                style={{
                  color: isActive ? config.color : "var(--text-muted)",
                  background: isActive
                    ? `color-mix(in srgb, ${config.color} 12%, transparent)`
                    : "var(--bg-card)",
                  border: `1px solid ${isActive ? config.borderColor : "var(--glass-border)"}`,
                }}
              >
                {config.icon}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[12px] font-bold tracking-wide transition-colors duration-300"
                    style={{ color: isActive ? config.color : "var(--text-secondary)" }}
                  >
                    {config.name}
                  </span>
                  {isActive && (
                    <span
                      className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                      style={{
                        color: config.color,
                        background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                        border: `1px solid ${config.borderColor}`,
                        fontFamily: "var(--font-share-tech), monospace",
                      }}
                    >
                      SPEAKING
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 hidden sm:block">
                  {config.role}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
