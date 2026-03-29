"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API type augmentation
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null;
}

export function useSpeech() {
  const [recognizedText, setRecognizedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const startRecording = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const results = event.results;
      let transcript = "";
      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      setRecognizedText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const clearText = useCallback(() => {
    setRecognizedText("");
  }, []);

  return {
    recognizedText,
    isRecording,
    isSupported,
    startRecording,
    stopRecording,
    clearText,
  };
}
