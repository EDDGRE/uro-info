import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getTopics } from "@uro-info/content";

export const metadata: Metadata = {
  title: "UroOppslag — Klinisk oppslagsverk for LIS i urologi",
};

const HOME_CARD_CLASS: Record<string, string> = {
  maligne: "malign",
  kirurgi: "kirurgi",
};

export default function HomePage() {
  const categories = getCategories();
  const topics = getTopics().filter((t) => t.status === "ferdig" && t.cat !== "om");
  const labelByCategory = new Map(categories.map((c) => [c.id, c.badgeLabel]));

  return (
    <>
      <div className="home-hero">
        <h1>Klinisk oppslagsverk for urologi</h1>
        <p>
          Bygget for leger i spesialisering i Norge. Rask oppslag på benigne og maligne tilstander,
          behandlingsvalg og operasjonsteknikk — basert på Helsedirektoratets retningslinjer,
          supplert med EAU Guidelines der det er relevant.
        </p>
      </div>
      <h2 className="font-display text-heading mb-4 mt-0 text-[19px] font-bold">
        Alle oppslag
      </h2>
      <div className="home-grid">
        {topics.map((t) => (
          <div key={t.id} className={`home-card ${HOME_CARD_CLASS[t.cat] ?? ""}`.trim()}>
            <h3>{t.title}</h3>
            <p>
              {labelByCategory.get(t.cat)} — fullt utbygd oppslag med kilder fra Helsedirektoratet
              {t.cat === "kirurgi" || t.id === "peniskreft" ? " og EAU" : ""}.
            </p>
            <Link href={`/${t.id}`}>Åpne oppslag →</Link>
          </div>
        ))}
      </div>
    </>
  );
}
