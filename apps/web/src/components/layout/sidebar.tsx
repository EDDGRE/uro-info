import type { Category } from "@uro-info/content";

import { SidebarNav, type NavTopic } from "./sidebar-nav";

export function Sidebar({ categories, topics }: { categories: Category[]; topics: NavTopic[] }) {
  return (
    <aside className="border-border bg-background-dim sticky top-14 hidden h-[calc(100vh-56px)] w-[280px] shrink-0 overflow-y-auto border-r md:block">
      <SidebarNav categories={categories} topics={topics} />
    </aside>
  );
}
