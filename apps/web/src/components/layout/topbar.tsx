import Link from "next/link";
import type { Category, Topic } from "@uro-info/content";

import { MobileNav } from "./mobile-nav";
import { SearchCommand } from "@/components/search/search-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { KubIcon } from "@/components/icons/kub-icon";

export function Topbar({ categories, topics }: { categories: Category[]; topics: Topic[] }) {
  return (
    <header className="border-primary-deep bg-primary-deep sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 text-[#edeff2]">
      <MobileNav categories={categories} topics={topics} />
      <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap no-underline">
        <KubIcon className="h-6 w-6 text-white" />
        <span className="font-display text-[17px] font-bold tracking-[.2px] text-white">
          Uro Info
        </span>
        <span className="hidden font-mono text-[11px] text-[#9fb0c4] sm:inline">
          {"// LIS-oppslagsverk i urologi"}
        </span>
      </Link>
      <span className="ml-auto hidden shrink-0 whitespace-nowrap rounded-full border border-[#33475f] px-2.5 py-[3px] font-mono text-[11px] tracking-wide text-[#9fb0c4] lg:inline">
        Ansvarlig: <b className="font-semibold text-[#edeff2]">EDDGRE</b>
      </span>
      <div className="ml-auto flex max-w-[420px] flex-1 items-center gap-2 lg:ml-4">
        <SearchCommand />
      </div>
      <ThemeToggle />
    </header>
  );
}
