import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getTopics } from "@uro-info/content";

import { TAG_CLASS } from "@/lib/tag-class";
import { KubIcon } from "@/components/icons/kub-icon";

export const metadata: Metadata = {
  title: "Uro Info — Klinisk oppslagsverk for LIS i urologi",
};

const HOME_CARD_CLASS: Record<string, string> = {
  maligne: "malign",
  kirurgi: "kirurgi",
};

export default function HomePage() {
  const categories = getCategories();
  const topics = getTopics().filter((t) => t.status === "ferdig" && t.cat !== "om");
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <>
      <div className="home-hero">
        <h1 className="flex items-center gap-3">
          <KubIcon className="h-8 w-8 shrink-0 text-white" />
          Klinisk oppslagsverk for LIS i urologi
        </h1>
        <p>
          Bygger på Helsedirektoratets retningslinjer, Ahus&rsquo; interne prosedyrer og EAU
          Guidelines — samlet ett sted for rask oppslag i klinisk hverdag.
        </p>
      </div>
      <h2 className="font-display text-heading mb-4 mt-0 text-[19px] font-bold">Alle oppslag</h2>
      <div className="home-grid">
        {topics.map((t) => {
          const category = categoryById.get(t.cat);
          return (
            <div key={t.id} className={`home-card ${HOME_CARD_CLASS[t.cat] ?? ""}`.trim()}>
              {category && (
                <span className={`tag ${TAG_CLASS[category.id] ?? ""} mb-2 inline-block`.trim()}>
                  {category.badgeLabel}
                </span>
              )}
              <h3>{t.title}</h3>
              {t.summary && <p>{t.summary}</p>}
              <Link href={`/${t.id}`}>Åpne oppslag →</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
