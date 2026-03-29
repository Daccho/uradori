"use client";

import { useCallback, useRef, useState } from "react";
import { fetchTTSAudio } from "@/lib/api-client";
import type { Speaker } from "@/lib/types";

type QueueItem = { text: string; speaker: Speaker; audioUrl?: string };

export function useTTSPlayback() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const isProcessingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (queueRef.current.length > 0) {
      const item = queueRef.current.shift()!;
      setIsSpeaking(true);
      setCurrentSpeaker(item.speaker);

      try {
        let audioData: ArrayBuffer;
        if (item.audioUrl) {
          // SSEイベントにaudio_urlがある場合、R2キャッシュから取得
          const res = await fetch(item.audioUrl);
          if (!res.ok) throw new Error("Audio fetch failed");
          audioData = await res.arrayBuffer();
        } else {
          // フォールバック: 従来のTTS APIコール
          audioData = await fetchTTSAudio(item.text, item.speaker);
        }
        const blob = new Blob([audioData], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        await new Promise<void>((resolve) => {
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            resolve();
          };

          audio.play().catch(() => resolve());
        });
      } catch {
        // TTS fetch failed, skip to next
      }
    }

    setIsSpeaking(false);
    setCurrentSpeaker(null);
    isProcessingRef.current = false;
  }, []);

  const enqueue = useCallback(
    (text: string, speaker: Speaker, audioUrl?: string) => {
      queueRef.current.push({ text, speaker, audioUrl });
      processQueue();
    },
    [processQueue]
  );

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setCurrentSpeaker(null);
    isProcessingRef.current = false;
  }, []);

  return { isSpeaking, currentSpeaker, enqueue, stop };
}
