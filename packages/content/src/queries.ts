import { CATEGORIES } from "./categories";
import { TOPICS } from "./topics";
import type { Category, CategoryId, Topic } from "./schema";

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getTopics(): Topic[] {
  return TOPICS;
}

export function getPublishedTopics(): Topic[] {
  return TOPICS.filter((t) => t.status === "ferdig");
}

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function getTopicsByCategory(catId: CategoryId): Topic[] {
  return TOPICS.filter((t) => t.cat === catId);
}
