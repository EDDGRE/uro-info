import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addHeadingIds } from "./search-utils";

// Topic bodies are trusted, author-controlled HTML fragments (not MDX/JSX) — the source
// content uses plain `class="..."` / `style="color:..."` attributes throughout, which are
// not valid JSX, so it is read as raw text and rendered via dangerouslySetInnerHTML rather
// than compiled.
const topicsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "topics");

// `<h2>`s get a stable, slugified `id` injected so headings are deep-linkable (search
// results land on the right section, not just the top of the page) — done once here so
// both the rendered page and buildSearchIndex() see identical anchors.
function read(file: string): string {
  return addHeadingIds(readFileSync(path.join(topicsDir, file), "utf8"));
}

export function getTopicHtml(id: string): string {
  return read(`${id}.html`);
}

export function getTopicShortHtml(id: string): string {
  return read(`${id}.short.html`);
}

export function getTopicDetailedHtml(id: string): string {
  return read(`${id}.detailed.html`);
}

export function getTopicTabHtml(id: string, tabId: string): string {
  return read(`${id}.${tabId}.html`);
}

export function getTopicChecklistHtml(id: string): string {
  return read(`${id}.checklist.html`);
}
