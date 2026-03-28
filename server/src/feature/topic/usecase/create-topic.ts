import { uuidv7 } from "uuidv7";
import type { Topic, CreateTopicInput } from "../domain/entity";
import type { TopicRepository } from "../domain/repository";

export class CreateTopicUsecase {
  constructor(private repository: TopicRepository) {}

  async execute(input: CreateTopicInput): Promise<string> {
    const id = uuidv7();
    const topic: Topic = { id, ...input };
    await this.repository.create(topic);
    return id;
  }
}
