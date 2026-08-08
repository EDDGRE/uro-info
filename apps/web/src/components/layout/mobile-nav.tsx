"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { Category, Topic } from "@uro-info/content";
import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from "@uro-info/ui";

import { SidebarNav } from "./sidebar-nav";

export function MobileNav({ categories, topics }: { categories: Category[]; topics: Topic[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Meny"
          className="text-inherit hover:bg-white/10 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetTitle className="sr-only">Navigasjon</SheetTitle>
        <div className="overflow-y-auto">
          <SidebarNav categories={categories} topics={topics} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
