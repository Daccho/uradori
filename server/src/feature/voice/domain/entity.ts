export type AudienceVoice = {
  id: string;
  topicId: string;
  text: string;
  createdAt: string | null;
};

export type SubmitVoiceInput = {
  topicId: string;
  text: string;
};

export class AppError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}
