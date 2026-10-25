"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "uro-info:show-ahus-internal";
const CHANGE_EVENT = "uro-info:show-ahus-internal-change";

function readStored(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function applyAttribute(value: boolean) {
  document.documentElement.dataset.showAhus = value ? "true" : "false";
}

/**
 * Shared, localStorage-backed reader preference for whether Ahus-internal content is
 * shown — the "callout internal" boxes, and topics tagged `ahusOnly` that have nothing
 * general left once those are hidden. Defaults to shown; the toggle is for visitors from
 * other hospitals/departments. Every instance of this hook stays in sync via a window
 * event (same tab) and the native `storage` event (other tabs).
 *
 * Visibility itself is driven by CSS reacting to `html[data-show-ahus]` (see
 * content.css), not by this hook's React state — so components that only need to hide
 * markup (home page cards, sidebar links) don't need to call this at all. Only the
 * toggle button and the client-side search index (which can't be CSS-masked) need it.
 */
export function useAhusVisibility() {
  const [show, setShow] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readStored();
    setShow(initial);
    applyAttribute(initial);
    setHydrated(true);

    function onChange() {
      setShow(readStored());
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !readStored();
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore unavailable storage
    }
    applyAttribute(next);
    setShow(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { show, hydrated, toggle };
}
