"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@uro-info/ui";

interface Tab {
  id: string;
  label: string;
  html: string;
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
        </TabsContent>
      ))}
    </Tabs>
  );
}
