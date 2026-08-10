import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategoryById,
  getPublishedTopics,
  getTopicById,
  getTopicChecklistHtml,
  getTopicDetailedHtml,
  getTopicHtml,
  getTopicShortHtml,
  getTopicTabHtml,
} from "@uro-info/content";

import { CompetencyTable } from "@/components/topic/competency-table";
import { TabbedContent } from "@/components/topic/tabbed-content";
import { FavoriteButton } from "@/components/topic/favorite-button";
import { RecordVisit } from "@/components/topic/record-visit";
import { PsadCalculator } from "@/components/topic/psad-calculator";
import { KidneyGrowthCalculator } from "@/components/topic/kidney-growth-calculator";
import { TAG_CLASS } from "@/lib/tag-class";

export function generateStaticParams() {
  return getPublishedTopics().map((t) => ({ slug: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicById(slug);
  if (!topic) return {};
  return { title: `${topic.title} — Uro Info` };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = getTopicById(slug);
  if (!topic || topic.status !== "ferdig") notFound();

  const category = getCategoryById(topic.cat);

  return (
    <>
      <RecordVisit topicId={topic.id} />

      <div className="crumb">
        <Link href="/">Uro Info</Link> / {category?.label}
      </div>

      <div className="mb-1.5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="pagetitle">{topic.title}</h1>
        <FavoriteButton topicId={topic.id} />
      </div>

      <div className="tagrow">
        {category && (
          <span className={`tag ${TAG_CLASS[category.id] ?? ""}`.trim()}>
            {category.badgeLabel}
          </span>
        )}
        {topic.icd && <span className="tag tag-code">ICD-10: {topic.icd}</span>}
        {topic.ncsp && <span className="tag tag-code">NCSP: {topic.ncsp}</span>}
      </div>

      {topic.komp && <CompetencyTable items={topic.komp} />}

      {topic.indication && <div dangerouslySetInnerHTML={{ __html: topic.indication }} />}

      {topic.contentType === "simple" && !topic.hasChecklist && (
        <>
          <div className="content" dangerouslySetInnerHTML={{ __html: getTopicHtml(topic.id) }} />
          {topic.id === "nyrekreft" && <KidneyGrowthCalculator />}
        </>
      )}
      {topic.contentType === "simple" && topic.hasChecklist && (
        <TabbedContent
          tabs={[
            { id: "info", label: "Info", html: getTopicHtml(topic.id) },
            {
              id: "checklist",
              label: "Preop. sjekkliste",
              html: getTopicChecklistHtml(topic.id),
            },
          ]}
        />
      )}
      {topic.contentType === "toggle" && (
        <TabbedContent
          tabs={[
            { id: "kort", label: "KORT (sjekkliste)", html: getTopicShortHtml(topic.id) },
            { id: "detaljert", label: "DETALJERT", html: getTopicDetailedHtml(topic.id) },
            ...(topic.hasChecklist
              ? [
                  {
                    id: "checklist",
                    label: "Preop. sjekkliste",
                    html: getTopicChecklistHtml(topic.id),
                  },
                ]
              : []),
          ]}
        />
      )}
      {topic.contentType === "tabs" && topic.tabs && (
        <TabbedContent
          tabs={topic.tabs.map((t) => {
            const isProstatakreftUtredning = topic.id === "prostatakreft" && t.id === "utredning";
            return {
              ...t,
              html: getTopicTabHtml(topic.id, t.id),
              extra: isProstatakreftUtredning ? <PsadCalculator /> : undefined,
              htmlAfter: isProstatakreftUtredning
                ? getTopicTabHtml(topic.id, "utredning-tail")
                : undefined,
            };
          })}
        />
      )}

      {topic.outro && <div dangerouslySetInnerHTML={{ __html: topic.outro }} />}
    </>
  );
}
