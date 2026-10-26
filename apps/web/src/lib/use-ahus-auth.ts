"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Whether this browser has unlocked Ahus-internal content. Unlike useAhusVisibility
 * (a client-side preference for whether to *show* content that's present), this
 * reflects a real server-side decision made by the Cloudflare Worker: without a valid
 * `uro_ahus_auth` cookie, the Worker strips Ahus-internal content out of every response
 * before it reaches the browser, and stamps `data-ahus-unlocked` on <html> only when it
 * didn't. See worker/index.ts.
 */
export function useAhusAuth() {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUnlocked(document.documentElement.dataset.ahusUnlocked === "true");
    setChecked(true);
  }, []);

  const submitPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/_auth_ahus", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { unlocked, checked, submitPassword };
}
