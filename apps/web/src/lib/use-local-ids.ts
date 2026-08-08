"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Generic localStorage-backed list of topic ids, used for both favorites and recently
 * viewed. Starts empty on the server and hydrates from localStorage after mount, so the
 * server-rendered markup never mismatches the client (the two sets differ per browser).
 */
export function useLocalIds(storageKey: string, maxItems?: number) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      // ignore malformed/unavailable storage
    }
    setHydrated(true);
  }, [storageKey]);

  const persist = useCallback(
    (next: string[]) => {
      setIds(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore quota/unavailable storage errors
      }
    },
    [storageKey],
  );

  const add = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = [id, ...current.filter((existing) => existing !== id)];
        const trimmed = maxItems ? next.slice(0, maxItems) : next;
        persist(trimmed);
        return trimmed;
      });
    },
    [maxItems, persist],
  );

  const remove = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.filter((existing) => existing !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggle = useCallback(
    (id: string) => {
      setIds((current) => {
        const next = current.includes(id)
          ? current.filter((existing) => existing !== id)
          : [id, ...current];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, hydrated, add, remove, toggle, has };
}
