"use client";

import { useLocalIds } from "./use-local-ids";

const RECENT_KEY = "uro-info:recent";
const MAX_RECENT = 6;

export function useRecent() {
  return useLocalIds(RECENT_KEY, MAX_RECENT);
}
