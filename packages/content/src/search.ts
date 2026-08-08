import { getPublishedTopics } from "./queries";
import { getTopicHtml, getTopicShortHtml, getTopicDetailedHtml } from "./html";
import { stripHtmlTags } from "./search-utils";
import type { CategoryId } from "./schema";

export interface SearchEntry {
  id: string;
  title: string;
  category: CategoryId;
  /** ICD-10 / NCSP codes, space separated. */
  codeText: string;
  /** Plain text body (HTML tags stripped) used for full-text matching + snippets. */
  bodyText: string;
}

export function buildSearchIndex(): SearchEntry[] {
  return getPublishedTopics().map((topic) => {
    const raw =
      topic.contentType === "simple"
        ? getTopicHtml(topic.id)
        : (topic.indication ?? "") + getTopicShortHtml(topic.id) + getTopicDetailedHtml(topic.id);

    return {
      id: topic.id,
      title: topic.title,
      category: topic.cat,
      codeText: [topic.icd, topic.ncsp].filter(Boolean).join(" "),
      bodyText: stripHtmlTags(raw),
    };
  });
}

export { stripHtmlTags, snippetAround } from "./search-utils";
