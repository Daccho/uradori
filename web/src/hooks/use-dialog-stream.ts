"use client";

import { useCallback, useRef, useState } from "react";
import { streamDialogSSE } from "@/lib/sse";
import type {
  DialogMessage,
  DialogStreamEvent,
  GeneratedQuestion,
} from "@/lib/types";

export type DialogState = {
  messages: DialogMessage[];
  questions: GeneratedQuestion[];
  isStreaming: boolean;
  sessionId: string | null;
  error: string | null;
};

export function useDialogStream() {
  const [state, setState] = useState<DialogState>({
    messages: [],
    questions: [],
    isStreaming: false,
    sessionId: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const onEventRef = useRef<((event: DialogStreamEvent) => void) | null>(null);

  const startDialog = useCallback(async (topicId: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      messages: [],
      questions: [],
      isStreaming: true,
      sessionId: null,
      error: null,
    });

    try {
      for await (const event of streamDialogSSE(topicId, controller.signal)) {
        onEventRef.current?.(event);

        switch (event.type) {
          case "questions":
            setState((s) => ({ ...s, questions: event.questions }));
            break;
          case "dialog":
            setState((s) => ({
              ...s,
              messages: [
                ...s.messages,
                {
                  speaker: event.speaker,
                  text: event.text,
                  question: event.question,
                  source: event.source as DialogMessage["source"],
                },
              ],
            }));
            break;
          case "done":
            setState((s) => ({
              ...s,
              isStreaming: false,
              sessionId: event.session_id,
            }));
            break;
          case "error":
            setState((s) => ({
              ...s,
              isStreaming: false,
              error: event.message,
            }));
            break;
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: (err as Error).message,
        }));
      }
    }
  }, []);

  const cancelDialog = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const setOnEvent = useCallback(
    (handler: (event: DialogStreamEvent) => void) => {
      onEventRef.current = handler;
    },
    []
  );

  return { ...state, startDialog, cancelDialog, setOnEvent };
}
