// Pure string helpers used for search — kept separate from search.ts/html.ts (which use
// node:fs) so client components can import this module directly without pulling fs into
// the browser bundle.

export function stripHtmlTags(html: string): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9æøå]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "seksjon"
  );
}

/**
 * Injects a stable `id` on every `<h2>` that doesn't already have one, slugified from its
 * text. Used both to make headings deep-linkable from search results, and (by
 * `buildSearchIndex`) to split a topic's body into per-section search entries.
 */
export function addHeadingIds(html: string): string {
  const used = new Map<string, number>();
  return html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (match, attrs: string | undefined) => {
    if (attrs && /\bid\s*=/.test(attrs)) return match;
    const inner = match.replace(/^<h2[^>]*>/, "").replace(/<\/h2>$/, "");
    let slug = slugify(stripHtmlTags(inner));
    const n = used.get(slug) ?? 0;
    used.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n + 1}`;
    return `<h2${attrs ?? ""} id="${slug}">${inner}</h2>`;
  });
}

/** Splits heading-ided HTML into {anchor, heading, text} chunks, one per `<h2>`. The first
 * chunk (before any heading) has no anchor/heading — it's the topic's own intro text. */
export function splitIntoSections(
  html: string,
): { anchor?: string; heading?: string; text: string }[] {
  const parts: { anchor?: string; heading?: string; text: string }[] = [];
  const re = /<h2(?:\s[^>]*)?\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  let lastIndex = 0;
  let anchor: string | undefined;
  let heading: string | undefined;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    parts.push({ anchor, heading, text: stripHtmlTags(html.slice(lastIndex, m.index)) });
    anchor = m[1];
    heading = stripHtmlTags(m[2]!);
    lastIndex = re.lastIndex;
  }
  parts.push({ anchor, heading, text: stripHtmlTags(html.slice(lastIndex)) });
  return parts.filter((p) => p.text.trim().length > 0);
}

export function snippetAround(text: string, query: string): string {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return "";
  const start = Math.max(0, i - 40);
  const end = Math.min(text.length, i + query.length + 60);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < text.length) snippet = `${snippet}…`;
  return snippet;
}
