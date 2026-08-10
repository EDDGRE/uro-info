import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getCategoryById,
  getPublishedTopics,
  getTopicById,
  getTopicDetailedHtml,
  getTopicHtml,
  getTopicShortHtml,
} from "@uro-info/content";

import { CompetencyTable } from "@/components/topic/competency-table";
import { ViewToggle } from "@/components/topic/view-toggle";
import { FavoriteButton } from "@/components/topic/favorite-button";
import { RecordVisit } from "@/components/topic/record-visit";
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

      {topic.contentType === "simple" ? (
        <div className="content" dangerouslySetInnerHTML={{ __html: getTopicHtml(topic.id) }} />
      ) : (
        <ViewToggle short={getTopicShortHtml(topic.id)} detailed={getTopicDetailedHtml(topic.id)} />
      )}
    </>
  );
}
