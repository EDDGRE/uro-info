"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@uro-info/ui";

import { parseHash, scrollToAnchor } from "@/lib/hash-nav";

interface Tab {
  id: string;
  label: string;
  html: string;
  /** Rendered after `html` — e.g. an interactive calculator. */
  extra?: ReactNode;
}

export function TabbedContent({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    function applyHash() {
      const { tabId, anchor } = parseHash(window.location.hash);
      if (tabId && tabs.some((t) => t.id === tabId)) setActive(tabId);
      scrollToAnchor(anchor);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!tabs.length) return null;

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList className="mb-[22px]">
        {tabs.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          <div className="content" dangerouslySetInnerHTML={{ __html: t.html }} />
          {t.extra}
        </TabsContent>
      ))}
    </Tabs>
  );
}
