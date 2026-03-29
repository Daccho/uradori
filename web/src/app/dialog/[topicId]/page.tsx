"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { fetchTopics } from "@/lib/api-client";
import type { TopicItem, DialogStreamEvent } from "@/lib/types";
import { useDialogStream } from "@/hooks/use-dialog-stream";
import { useTTSPlayback } from "@/hooks/use-tts-playback";
import { QuestionList } from "@/components/dialog/QuestionList";
import { DialogPanel } from "@/components/dialog/DialogPanel";
import { VoiceInput } from "@/components/voice/VoiceInput";
import { FloatingVoiceBubbles } from "@/components/dialog/FloatingVoiceBubble";

const AvatarScene = dynamic(
  () =>
    import("@/components/avatar/AvatarScene").then((mod) => mod.AvatarScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded overflow-hidden flex items-center justify-center"
        style={{
          height: 280,
          background: "rgba(6, 13, 26, 0.6)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <span
          className="text-[10px] text-[var(--text-muted)] tracking-wider"
          style={{ fontFamily: "var(--font-share-tech), monospace" }}
        >
          LOADING 3D...
        </span>
      </div>
    ),
  }
);

export default function DialogPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = use(params);
  const [topic, setTopic] = useState<TopicItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dialog = useDialogStream();
  const tts = useTTSPlayback();

  // Fetch topic info
  useEffect(() => {
    fetchTopics().then((topics) => {
      const found = topics.find((t) => t.id === topicId);
      if (found) setTopic(found);
    });
  }, [topicId]);

  // Wire SSE dialog events to TTS
  useEffect(() => {
    dialog.setOnEvent((event: DialogStreamEvent) => {
      if (event.type === "dialog") {
        tts.enqueue(event.text, event.speaker, event.audio_url);
      }
    });
  }, [dialog.setOnEvent, tts.enqueue]);

  // Mute video when TTS is speaking (matches iOS behavior)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = tts.isSpeaking;
    }
  }, [tts.isSpeaking]);

  const handleStartDialog = useCallback(() => {
    tts.stop();
    dialog.startDialog(topicId);
  }, [topicId, dialog.startDialog, tts.stop]);

  // Collect audience voice texts for floating bubbles
  const audienceTexts = useMemo(
    () =>
      dialog.messages
        .filter((m) => m.speaker === "audience")
        .map((m) => m.text),
    [dialog.messages]
  );

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* === Video Background === */}
      <div className="standby-bg">
        {/* Video element — src can be set via ?video= query param or configured */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Dark overlay vignette */}
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, rgba(6,13,26,0.2) 0%, rgba(6,13,26,0.6) 60%, rgba(6,13,26,0.85) 100%)",
          }}
        />
      </div>

      {/* === Floating Voice Bubbles (iOS: FloatingVoiceBubble in 3D space) === */}
      <FloatingVoiceBubbles texts={audienceTexts} />

      {/* === Overlay UI === */}
      <div className="relative z-20 flex-1 flex flex-col min-h-0">
        {/* Top bar */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-[var(--glass-border)]"
          style={{ background: "rgba(6,13,26,0.8)", backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--cyan-primary)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M9 3L5 7l4 4" />
              </svg>
              戻る
            </Link>
            <div className="w-px h-4 bg-[var(--glass-border)]" />
            <span className="text-[12px] font-bold text-[var(--text-primary)] truncate">
              {topic?.headline ?? "読み込み中..."}
            </span>
            {topic?.headline_genre && (
              <span className="hidden sm:inline px-2 py-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] rounded border border-[var(--glass-border)]">
                {topic.headline_genre}
              </span>
            )}
            {dialog.isStreaming && (
              <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
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
        </div>

        {/* Main content area — 2-column on desktop (iOS: left/right avatars + center panel) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {/* Left column: Avatars + Questions */}
          <div className="flex-shrink-0 lg:w-[320px] p-3 lg:p-4 space-y-3 overflow-y-auto lg:border-r border-[var(--glass-border)]"
            style={{ background: "rgba(6,13,26,0.4)" }}
          >
            {/* 3D Avatars (fallback: AvatarWipe during SSR/loading) */}
            <AvatarScene
              currentSpeaker={tts.currentSpeaker}
              isSpeaking={tts.isSpeaking}
            />

            {/* Generated questions */}
            <QuestionList questions={dialog.questions} />

            {/* Session info */}
            {dialog.sessionId && (
              <div className="glass-panel px-3 py-2 text-center">
                <span className="text-[10px] text-[var(--text-muted)]"
                  style={{ fontFamily: "var(--font-share-tech), monospace" }}
                >
                  SESSION ENDED — {dialog.sessionId.slice(0, 8)}
                </span>
              </div>
            )}
          </div>

          {/* Right column: Dialog panel (iOS: DialogPanelView at center) */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Error display */}
            {dialog.error && (
              <div className="mx-3 mt-3 glass-panel px-3 py-2.5" style={{ borderColor: "rgba(230,57,70,0.3)" }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red-primary)" strokeWidth="1.3">
                    <circle cx="7" cy="7" r="6" />
                    <path d="M7 4.5v3M7 9.5h.01" />
                  </svg>
                  <span className="text-[12px] text-[var(--red-primary)]">{dialog.error}</span>
                </div>
              </div>
            )}

            {/* Dialog log */}
            <div className="flex-1 p-3 lg:p-4 min-h-0">
              <DialogPanel
                messages={dialog.messages}
                isStreaming={dialog.isStreaming}
              />
            </div>

            {/* Voice input bar */}
            <VoiceInput
              topicId={topicId}
              isStreaming={dialog.isStreaming}
              onStartDialog={handleStartDialog}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
