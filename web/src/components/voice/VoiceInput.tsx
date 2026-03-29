"use client";

import { useState, useCallback, useEffect } from "react";
import { useSpeech } from "@/hooks/use-speech";
import { postVoice } from "@/lib/api-client";
import { SpeechButton } from "./SpeechButton";

const MAX_CHARS = 500;

export function VoiceInput({
  topicId,
  isStreaming,
  onStartDialog,
}: {
  topicId: string;
  isStreaming: boolean;
  onStartDialog: () => void;
}) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const {
    recognizedText,
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    clearText,
  } = useSpeech();

  // Apply recognized speech text
  useEffect(() => {
    if (recognizedText) {
      setText(recognizedText);
    }
  }, [recognizedText]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await postVoice(topicId, trimmed);
      setText("");
      clearText();
      setSubmitMessage("送信しました");
      setTimeout(() => setSubmitMessage(null), 2000);
    } catch (err) {
      setSubmitMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, topicId, clearText]);

  const handleToggleSpeech = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="flex-shrink-0 border-t border-[var(--glass-border)] bg-[var(--bg-panel)]">
      {/* Status message */}
      {submitMessage && (
        <div className="px-3 py-1.5 text-[11px] text-center border-b border-[var(--glass-border)]"
          style={{ color: submitMessage === "送信しました" ? "#22c55e" : "var(--red-primary)" }}
        >
          {submitMessage}
        </div>
      )}

      <div className="px-3 py-2.5 space-y-2">
        {/* Input row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="あなたの意見を入力..."
              disabled={isSubmitting}
              className="w-full h-9 px-3 rounded text-[13px] placeholder:text-[var(--text-muted)] text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--glass-border)] focus:border-[var(--cyan-primary)] focus:outline-none transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  handleSubmit();
                }
              }}
            />
          </div>
          <SpeechButton
            isRecording={isRecording}
            isSupported={isSupported}
            onToggle={handleToggleSpeech}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isOverLimit || isSubmitting}
            className="flex-shrink-0 h-9 px-3 rounded text-[12px] font-bold tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
            }}
          >
            送信
          </button>
          <button
            onClick={onStartDialog}
            disabled={isStreaming}
            className="flex-shrink-0 h-9 px-4 rounded text-[12px] font-bold tracking-wide transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: isStreaming ? "rgba(230, 57, 70, 0.08)" : "rgba(230, 57, 70, 0.15)",
              border: `1px solid ${isStreaming ? "rgba(230, 57, 70, 0.2)" : "rgba(230, 57, 70, 0.4)"}`,
              color: "var(--red-primary)",
            }}
          >
            {isStreaming ? "対話中..." : "対話開始"}
          </button>
        </div>

        {/* Character counter */}
        <div className="flex items-center justify-between px-1">
          {isRecording && (
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--red-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-primary)]" style={{ animation: "on-air-pulse 1s ease-in-out infinite" }} />
              音声認識中...
            </span>
          )}
          <span className={`text-[10px] tabular-nums ml-auto ${isOverLimit ? "text-[var(--red-primary)]" : "text-[var(--text-muted)]"}`}
            style={{ fontFamily: "var(--font-share-tech), monospace" }}
          >
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
}
