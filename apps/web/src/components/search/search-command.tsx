"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchEntry } from "@uro-info/content";
import { snippetAround } from "@uro-info/content/search-utils";
import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@uro-info/ui";

const CATEGORY_LABELS: Record<string, string> = {
  akutt: "Akutturologi",
  benigne: "Benigne tilstander",
  maligne: "Maligne tilstander",
  kirurgi: "Operasjonsteknikker",
  admin: "Henvisningsvurdering",
  om: "Om siden",
};

const MAX_RESULTS = 25;

interface Match {
  entry: SearchEntry;
  snippet: string;
}

// cmdk's built-in fuzzy filter scores every item's *entire* value on each keystroke —
// fine for short labels, but far too slow once the value includes a topic's full body
// text (tens of KB × 45 topics). Filtering is done here instead, the same way the
// original vanilla-JS search did it: cheap substring checks, title matches first.
function filterEntries(entries: SearchEntry[], query: string): Match[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const titleMatches: Match[] = [];
  const codeMatches: Match[] = [];
  const bodyMatches: Match[] = [];

  for (const entry of entries) {
    if (entry.title.toLowerCase().includes(q)) {
      titleMatches.push({ entry, snippet: "" });
    } else if (entry.codeText.toLowerCase().includes(q)) {
      codeMatches.push({ entry, snippet: "" });
    } else if (entry.bodyText.toLowerCase().includes(q)) {
      bodyMatches.push({ entry, snippet: snippetAround(entry.bodyText, q) });
    }
  }

  return [...titleMatches, ...codeMatches, ...bodyMatches].slice(0, MAX_RESULTS);
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const router = useRouter();

  const matches = useMemo(() => filterEntries(entries, query), [entries, query]);

  // Fetched as a static asset (see app/search-index.json/route.ts) rather than passed
  // down from the root layout, so the ~200KB of topic text isn't re-embedded in every
  // page's RSC payload — only loaded once, the first time search is opened.
  useEffect(() => {
    if (!open || entries.length > 0) return;
    let cancelled = false;
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchEntry[]) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        // search is a progressive enhancement — a failed fetch just leaves it empty
      });
    return () => {
      cancelled = true;
    };
  }, [open, entries.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(id: string) {
    setOpen(false);
    setQuery("");
    router.push(`/${id}`);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full max-w-[420px] justify-start gap-2 rounded-full border-white/20 bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
      >
        <Search className="h-3.5 w-3.5 opacity-70" />
        <span className="flex-1 text-left text-sm font-normal">
          Søk (f.eks. TURP, Gleason, PSA-residiv)…
        </span>
        <kbd className="hidden rounded border border-white/20 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Søk i UroOppslag" shouldFilter={false}>
        <CommandInput
          placeholder="Søk (f.eks. TURP, Gleason, PSA-residiv)…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{query ? "Ingen treff." : "Skriv for å søke."}</CommandEmpty>
          <CommandGroup>
            {matches.map(({ entry, snippet }) => (
              <CommandItem key={entry.id} value={entry.id} onSelect={() => go(entry.id)}>
                <span className="font-medium">{entry.title}</span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {CATEGORY_LABELS[entry.category] ?? entry.category}
                </span>
                {snippet && <span className="text-xs text-muted-foreground">{snippet}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
