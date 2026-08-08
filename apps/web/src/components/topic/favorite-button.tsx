"use client";

import { Star } from "lucide-react";
import { Button, cn } from "@uro-info/ui";

import { useFavorites } from "@/lib/use-favorites";

export function FavoriteButton({ topicId }: { topicId: string }) {
  const { has, toggle } = useFavorites();
  const active = has(topicId);

  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      aria-pressed={active}
      onClick={() => toggle(topicId)}
      className="gap-1.5 rounded-full"
    >
      <Star className={cn("h-3.5 w-3.5", active && "fill-current")} />
      {active ? "Favoritt" : "Legg til favoritt"}
    </Button>
  );
}
