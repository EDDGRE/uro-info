import type { CategoryId } from "@uro-info/content";

/** Maps a category to its `.tag-*` color class from content.css. */
export const TAG_CLASS: Partial<Record<CategoryId, string>> = {
  benigne: "tag-benign",
  maligne: "tag-malign",
  kirurgi: "tag-kirurgi",
  admin: "tag-internal",
  akutt: "tag-akutt",
};
