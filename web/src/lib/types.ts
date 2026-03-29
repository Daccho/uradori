// Mirrors server/src/feature/dialog/domain/entity.ts

export type TopicItem = {
  id: string;
  title_id: string;
  onair_date: string;
  headline: string;
  corner_start_time: string | null;
  corner_end_time: string | null;
  headline_genre: string | null;
};

export type GeneratedQuestion = {
  text: string;
  basedOnCount: number;
};

export type Speaker = "sorajiro" | "audience";

export type InfoSource = "broadcast" | "unaired" | "opendata";

export type DialogMessage = {
  speaker: Speaker;
  text: string;
  question?: string;
  source?: InfoSource;
};

export type DialogStreamEvent =
  | { type: "questions"; questions: GeneratedQuestion[] }
  | {
      type: "dialog";
      question: string;
      speaker: Speaker;
      text: string;
      source?: InfoSource;
      audio_url?: string;
    }
  | { type: "done"; session_id: string }
  | { type: "error"; code: string; message: string };
