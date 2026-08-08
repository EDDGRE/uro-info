import { NextResponse } from "next/server";
import { buildSearchIndex } from "@uro-info/content";

// Served as a static asset (not embedded in every page's RSC payload) so the ~200KB of
// stripped topic text only ever gets downloaded once, when the search dialog is first
// opened, and can be precached by the service worker for offline search.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(buildSearchIndex());
}
