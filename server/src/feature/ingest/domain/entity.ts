export type Material = {
  id: string;
  topicId: string;
  type: string;
  content: string;
  vectorizeId?: string;
  createdAt?: string;
};

export type IngestAutoInput = {
  mode: "auto";
  topicId: string;
  sources: ("corners" | "news" | "youtube")[];
};

export type IngestManualInput = {
  mode: "manual";
  topicId: string;
  content: string;
  type: "opendata";
  sourceUrl?: string;
};

export type IngestInput = IngestAutoInput | IngestManualInput;
