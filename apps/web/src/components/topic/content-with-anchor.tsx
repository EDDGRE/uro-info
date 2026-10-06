"use client";

import { useEffect } from "react";

import { parseHash, scrollToAnchor } from "@/lib/hash-nav";

/** Scrolls to the heading named in the URL hash after mount — the untabbed-content
 * counterpart to TabbedContent's own hash handling. */
export function ContentWithAnchor({ html }: { html: string }) {
  useEffect(() => {
    function applyHash() {
      scrollToAnchor(parseHash(window.location.hash).anchor);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return <div className="content" dangerouslySetInnerHTML={{ __html: html }} />;
}
