import { getPublishedTopics } from "./queries";
import { getTopicHtml, getTopicShortHtml, getTopicDetailedHtml, getTopicTabHtml } from "./html";
import { stripHtmlTags } from "./search-utils";
import type { CategoryId, Topic } from "./schema";

export interface SearchEntry {
  id: string;
  title: string;
  category: CategoryId;
  /** ICD-10 / NCSP codes, space separated. */
  codeText: string;
  /** Plain text body (HTML tags stripped) used for full-text matching + snippets. */
  bodyText: string;
}

function getTopicRawHtml(topic: Topic): string {
  const intro = topic.indication ?? "";
  const outro = topic.outro ?? "";
  if (topic.contentType === "simple") return intro + getTopicHtml(topic.id) + outro;
  if (topic.contentType === "toggle") {
    return intro + getTopicShortHtml(topic.id) + getTopicDetailedHtml(topic.id) + outro;
  }
  const tabsHtml = (topic.tabs ?? []).map((t) => getTopicTabHtml(topic.id, t.id)).join(" ");
  return intro + tabsHtml + outro;
}

export function buildSearchIndex(): SearchEntry[] {
  return getPublishedTopics().map((topic) => {
    const raw = getTopicRawHtml(topic);

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
