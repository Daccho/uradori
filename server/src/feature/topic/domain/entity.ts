export type Topic = {
  id: string;
  titleId: string;
  onairDate: string;
  headline: string;
  cornerStartTime?: string | null;
  cornerEndTime?: string | null;
  headlineGenre?: string | null;
  broadcastScript?: string | null;
};

export type CreateTopicInput = Omit<Topic, "id">;

export type ListTopicsFilter = {
  titleId?: string;
  onairDate?: string;
};
