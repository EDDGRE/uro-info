import { getPublishedTopics } from "./queries";
import {
  getTopicHtml,
  getTopicShortHtml,
  getTopicDetailedHtml,
  getTopicTabHtml,
  getTopicChecklistHtml,
} from "./html";
import { stripHtmlTags, splitIntoSections } from "./search-utils";
import type { CategoryId, Topic } from "./schema";

export interface SearchEntry {
  /** Unique across the whole index. */
  id: string;
  topicId: string;
  title: string;
  category: CategoryId;
  /** ICD-10 / NCSP codes, space separated. */
  codeText: string;
  /** Which tab/variant this section lives in (undefined for untabbed topics) — the frontend
   * activates this tab before scrolling, so the match is actually visible. */
  tabId?: string;
  /** Display label for `tabId` (e.g. "BCG-behandling"), shown in results for context. */
  tabLabel?: string;
  /** The `<h2>` heading text this section falls under, if any. */
  heading?: string;
  /** The heading's slug — `id` of the `<h2>` to scroll to. Undefined means "just land on
   * the topic page" (e.g. the intro text before the first heading). */
  anchor?: string;
  /** Plain text of just this section, used for matching + snippets. */
  bodyText: string;
}

interface Segment {
  tabId?: string;
  tabLabel?: string;
  html: string;
}

const TOGGLE_LABELS: Record<string, string> = {
  kort: "Kort (sjekkliste)",
  detaljert: "Detaljert",
  checklist: "Preop. sjekkliste",
};

function getTopicSegments(topic: Topic): Segment[] {
  if (topic.contentType === "simple") {
    const segments: Segment[] = [{ html: getTopicHtml(topic.id) }];
    if (topic.hasChecklist) {
      segments.push({
        tabId: "checklist",
        tabLabel: TOGGLE_LABELS.checklist,
        html: getTopicChecklistHtml(topic.id),
      });
    }
    return segments;
  }
  if (topic.contentType === "toggle") {
    const segments: Segment[] = [
      { tabId: "kort", tabLabel: TOGGLE_LABELS.kort, html: getTopicShortHtml(topic.id) },
      {
        tabId: "detaljert",
        tabLabel: TOGGLE_LABELS.detaljert,
        html: getTopicDetailedHtml(topic.id),
      },
    ];
    if (topic.hasChecklist) {
      segments.push({
        tabId: "checklist",
        tabLabel: TOGGLE_LABELS.checklist,
        html: getTopicChecklistHtml(topic.id),
      });
    }
    return segments;
  }
  // "tabs"
  return (topic.tabs ?? []).map((t) => {
    const tail =
      topic.id === "prostatakreft" && t.id === "utredning"
        ? getTopicTabHtml(topic.id, "utredning-tail")
        : "";
    return { tabId: t.id, tabLabel: t.label, html: getTopicTabHtml(topic.id, t.id) + tail };
  });
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const topic of getPublishedTopics()) {
    const codeText = [topic.icd, topic.ncsp].filter(Boolean).join(" ");
    const introExtra = stripHtmlTags(topic.indication ?? "");
    const segments = getTopicSegments(topic);
    let entryIndex = 0;

    segments.forEach((segment, segIdx) => {
      const sections = splitIntoSections(segment.html);
      sections.forEach((section, secIdx) => {
        // Fold the topic-level "indication" callout into the very first section of the
        // very first segment, so it's searchable without needing its own fake entry.
        const extra = segIdx === 0 && secIdx === 0 ? introExtra : "";
        const bodyText = [extra, section.text].filter(Boolean).join(" ");
        if (!bodyText.trim()) return;
        entries.push({
          id: `${topic.id}::${entryIndex++}`,
          topicId: topic.id,
          title: topic.title,
          category: topic.cat,
          codeText,
          tabId: segment.tabId,
          tabLabel: segment.tabLabel,
          heading: section.heading,
          anchor: section.anchor,
          bodyText,
        });
      });
    });

    const outroText = stripHtmlTags(topic.outro ?? "");
    if (outroText.trim()) {
      entries.push({
        id: `${topic.id}::${entryIndex++}`,
        topicId: topic.id,
        title: topic.title,
        category: topic.cat,
        codeText,
        bodyText: outroText,
      });
    }
  }

  return entries;
}

export {
  stripHtmlTags,
  snippetAround,
  slugify,
  addHeadingIds,
  splitIntoSections,
} from "./search-utils";
