"use client";

export function SpeechButton({
  isRecording,
  isSupported,
  onToggle,
}: {
  isRecording: boolean;
  isSupported: boolean;
  onToggle: () => void;
}) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded transition-all duration-200"
      style={{
        background: isRecording ? "rgba(230, 57, 70, 0.15)" : "var(--bg-card)",
        border: `1px solid ${isRecording ? "rgba(230, 57, 70, 0.4)" : "var(--glass-border)"}`,
        color: isRecording ? "var(--red-primary)" : "var(--text-muted)",
      }}
      title={isRecording ? "録音停止" : "音声入力"}
    >
      {isRecording ? (
        <span className="relative flex items-center justify-center">
          <span className="absolute w-6 h-6 rounded-full bg-[var(--red-primary)] opacity-20 animate-ping" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="4" width="8" height="8" rx="1" />
          </svg>
        </span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" />
          <path d="M3 7.5a5 5 0 0010 0M8 13v2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
