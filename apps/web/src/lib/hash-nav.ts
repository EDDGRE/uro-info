// Search results deep-link into a specific tab/heading via the URL hash, encoded as
// `#tab:<tabId>` or `#tab:<tabId>:<anchor>` (tabbed/toggle content) or plain `#<anchor>`
// (untabbed content). Parsed by TabbedContent / ContentWithAnchor to activate the right
// tab and scroll to the right heading after navigating in from search.
export function parseHash(hash: string): { tabId?: string; anchor?: string } {
  const h = hash.replace(/^#/, "");
  if (!h) return {};
  if (h.startsWith("tab:")) {
    const rest = h.slice(4);
    const sep = rest.indexOf(":");
    if (sep === -1) return { tabId: rest || undefined };
    return { tabId: rest.slice(0, sep) || undefined, anchor: rest.slice(sep + 1) || undefined };
  }
  return { anchor: h };
}

export function buildHash(tabId?: string, anchor?: string): string {
  if (tabId) return anchor ? `tab:${tabId}:${anchor}` : `tab:${tabId}`;
  return anchor ?? "";
}

export function scrollToAnchor(anchor?: string) {
  if (!anchor) return;
  requestAnimationFrame(() => {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
