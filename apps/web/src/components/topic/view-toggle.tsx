"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@uro-info/ui";

export function ViewToggle({ short, detailed }: { short: string; detailed: string }) {
  return (
    <Tabs defaultValue="kort">
      <TabsList className="mb-[22px]">
        <TabsTrigger value="kort">KORT (sjekkliste)</TabsTrigger>
        <TabsTrigger value="detaljert">DETALJERT</TabsTrigger>
      </TabsList>
      <TabsContent value="kort">
        <div className="content" dangerouslySetInnerHTML={{ __html: short }} />
      </TabsContent>
      <TabsContent value="detaljert">
        <div className="content" dangerouslySetInnerHTML={{ __html: detailed }} />
      </TabsContent>
    </Tabs>
  );
}
