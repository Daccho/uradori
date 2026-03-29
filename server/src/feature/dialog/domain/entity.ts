export type DialogSession = {
  id: string;
  topicId: string;
  status: "active" | "ended";
  createdAt: string;
  endedAt?: string;
};

export type DialogLog = {
  id: string;
  sessionId: string;
  topicId: string;
  speaker: "sorajiro" | "audience";
  text: string;
  source?: string;
  createdAt: string;
};

export type GeneratedQuestion = {
  text: string;
  basedOnCount: number;
};

export type DialogEvent =
  | { type: "questions"; questions: GeneratedQuestion[] }
  | {
      type: "dialog";
      question: string;
      speaker: "sorajiro" | "audience";
      text: string;
      source?: string;
    }
  | { type: "done"; sessionId: string };
