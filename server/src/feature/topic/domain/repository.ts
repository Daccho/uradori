import type { Topic, ListTopicsFilter } from "./entity";

export interface TopicRepository {
  create(topic: Topic): Promise<void>;
  findById(id: string): Promise<Topic | null>;
  list(filter: ListTopicsFilter): Promise<Topic[]>;
}
