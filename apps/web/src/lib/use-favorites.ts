"use client";

import { useLocalIds } from "./use-local-ids";

const FAVORITES_KEY = "uro-info:favorites";

export function useFavorites() {
  return useLocalIds(FAVORITES_KEY);
}
