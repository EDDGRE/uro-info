"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@uro-info/ui";

interface Tab {
  id: string;
  label: string;
  html: string;
  /** Rendered between `html` and `htmlAfter` — e.g. an interactive calculator. */
  extra?: ReactNode;
  /** Extra raw HTML rendered after `extra`, for splitting long tab content around `extra`. */
  htmlAfter?: string;
}

export function TabbedContent({ tabs }: { tabs: Tab[] }) {
  if (!tabs.length) return null;

  return (
    <Tabs defaultValue={tabs[0]!.id}>
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
          {t.htmlAfter && (
            <div className="content" dangerouslySetInnerHTML={{ __html: t.htmlAfter }} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
