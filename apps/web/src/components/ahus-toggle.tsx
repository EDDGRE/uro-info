"use client";

import { Building2 } from "lucide-react";

import { Button } from "@uro-info/ui";

import { useAhusVisibility } from "@/lib/use-ahus-visibility";

export function AhusToggle() {
  const { show, hydrated, toggle } = useAhusVisibility();
  const label = show
    ? "Skjul Ahus-internt innhold (for besøkende fra andre sykehus)"
    : "Vis Ahus-internt innhold igjen";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={hydrated ? !show : undefined}
      className="text-inherit hover:bg-white/10"
      onClick={toggle}
    >
      <Building2 className={`h-4 w-4 ${hydrated && !show ? "opacity-40" : ""}`} />
    </Button>
  );
}
