import type { Topic, ListTopicsFilter } from "../domain/entity";
import type { TopicRepository } from "../domain/repository";

export class ListTopicsUsecase {
  constructor(private repository: TopicRepository) {}

  async execute(filter: ListTopicsFilter): Promise<Topic[]> {
    return this.repository.list(filter);
  }
}
