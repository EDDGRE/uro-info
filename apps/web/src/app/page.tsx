import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getTopics } from "@uro-info/content";

import { TAG_CLASS } from "@/lib/tag-class";
import { UroMark } from "@/components/icons/uro-mark";

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

  return (
    <>
      <div className="home-hero">
        <h1 className="flex items-center gap-3">
          <UroMark className="h-8 w-auto shrink-0 text-white" />
          Uro Info — Klinisk oppslagsverk for LIS i urologi
        </h1>
        <p>
          Bygger på Helsedirektoratets retningslinjer, Ahus&rsquo; interne prosedyrer og EAU
          Guidelines — samlet ett sted for rask oppslag i klinisk hverdag.
        </p>
      </div>
      {categories.map((category) => {
        const items = topics
          .filter((t) => t.cat === category.id)
          .sort((a, b) => a.title.localeCompare(b.title, "nb"));
        if (!items.length) return null;
        return (
          <section key={category.id} className="mb-8">
            <h2 className="font-display text-heading mb-4 mt-0 flex items-center gap-2 text-[19px] font-bold">
              <span className={`swatch ${category.swatch}`} />
              {category.label}
            </h2>
            <div className="home-grid">
              {items.map((t) => (
                <div key={t.id} className={`home-card ${HOME_CARD_CLASS[t.cat] ?? ""}`.trim()}>
                  <span className={`tag ${TAG_CLASS[category.id] ?? ""} mb-2 inline-block`.trim()}>
                    {category.badgeLabel}
                  </span>
                  <h3>{t.title}</h3>
                  {t.summary && <p>{t.summary}</p>}
                  <Link href={`/${t.id}`}>Åpne oppslag →</Link>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
