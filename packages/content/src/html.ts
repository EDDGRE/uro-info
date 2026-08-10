import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Topic bodies are trusted, author-controlled HTML fragments (not MDX/JSX) — the source
// content uses plain `class="..."` / `style="color:..."` attributes throughout, which are
// not valid JSX, so it is read as raw text and rendered via dangerouslySetInnerHTML rather
// than compiled.
const topicsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "topics");

export function getTopicHtml(id: string): string {
  return readFileSync(path.join(topicsDir, `${id}.html`), "utf8");
}

export function getTopicShortHtml(id: string): string {
  return readFileSync(path.join(topicsDir, `${id}.short.html`), "utf8");
}

export function getTopicDetailedHtml(id: string): string {
  return readFileSync(path.join(topicsDir, `${id}.detailed.html`), "utf8");
}

export function getTopicTabHtml(id: string, tabId: string): string {
  return readFileSync(path.join(topicsDir, `${id}.${tabId}.html`), "utf8");
}
