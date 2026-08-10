import { getPublishedTopics } from "./queries";
import {
  getTopicHtml,
  getTopicShortHtml,
  getTopicDetailedHtml,
  getTopicTabHtml,
  getTopicChecklistHtml,
} from "./html";
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
  const checklist = topic.hasChecklist ? getTopicChecklistHtml(topic.id) : "";
  if (topic.contentType === "simple") return intro + getTopicHtml(topic.id) + checklist + outro;
  if (topic.contentType === "toggle") {
    return intro + getTopicShortHtml(topic.id) + getTopicDetailedHtml(topic.id) + checklist + outro;
  }
  const tailHtml = topic.id === "prostatakreft" ? getTopicTabHtml(topic.id, "utredning-tail") : "";
  const tabsHtml = (topic.tabs ?? []).map((t) => getTopicTabHtml(topic.id, t.id)).join(" ");
  return intro + tabsHtml + tailHtml + checklist + outro;
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
