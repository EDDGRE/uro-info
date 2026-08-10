import { z } from "zod";

export const categoryIdSchema = z.enum(["akutt", "benigne", "maligne", "kirurgi", "admin", "om"]);
export type CategoryId = z.infer<typeof categoryIdSchema>;

export const categorySchema = z.object({
  id: categoryIdSchema,
  label: z.string(),
  swatch: z.string(),
  /** Short badge text (e.g. "Benign") used on tags/cards — original site's TAGLABEL map. */
  badgeLabel: z.string(),
});
export type Category = z.infer<typeof categorySchema>;

export const competencyItemSchema = z.object({
  label: z.string(),
  count: z.number(),
  note: z.string().optional(),
});
export type CompetencyItem = z.infer<typeof competencyItemSchema>;

export const topicStatusSchema = z.enum(["ferdig", "planlagt"]);
export type TopicStatus = z.infer<typeof topicStatusSchema>;

export const topicContentTypeSchema = z.enum(["simple", "toggle"]);
export type TopicContentType = z.infer<typeof topicContentTypeSchema>;

export const topicSchema = z.object({
  id: z.string(),
  cat: categoryIdSchema,
  title: z.string(),
  status: topicStatusSchema,
  contentType: topicContentTypeSchema,
  icd: z.string().optional(),
  ncsp: z.string().optional(),
  komp: z.array(competencyItemSchema).optional(),
  /** Rendered as a fixed "Indikasjon" callout above kort/detaljert-toggle. Trusted, author-controlled HTML. */
  indication: z.string().optional(),
  /** One-sentence plain-text definition, shown on the home page topic cards. */
  summary: z.string().optional(),
});
export type Topic = z.infer<typeof topicSchema>;
