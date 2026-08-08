"use client";

import { useEffect } from "react";

import { useRecent } from "@/lib/use-recent";

export function RecordVisit({ topicId }: { topicId: string }) {
  const { add } = useRecent();

  useEffect(() => {
    add(topicId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  return null;
}
