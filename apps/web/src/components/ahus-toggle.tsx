"use client";

import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";

import { Button } from "@uro-info/ui";

import { useAhusVisibility } from "@/lib/use-ahus-visibility";

export function AhusToggle() {
  const { show, hydrated, toggle } = useAhusVisibility();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Ahus-internt innhold — klikk for å lese mer og skru av/på"
        aria-expanded={open}
        className="text-inherit hover:bg-white/10"
        onClick={() => setOpen((o) => !o)}
      >
        <Building2 className={`h-4 w-4 text-[#dd93b8] ${hydrated && !show ? "opacity-40" : ""}`} />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Ahus-internt innhold"
          className="border-internal bg-internal-tint text-popover-foreground absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] rounded-r-md border-l-[3px] p-3.5 text-left shadow-lg"
        >
          <p className="text-internal mb-1.5 font-mono text-[11px] uppercase tracking-wide">
            Ahus-internt innhold
          </p>
          <p className="mb-3 text-[12.5px] leading-snug opacity-85">
            Besøkende fra andre sykehus: bygningsikonet kan aktiveres for å skjule innhold merket
            «Ahus internt» da dette muligens ikke samsvarer med eksterne rutiner.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-internal text-internal hover:bg-internal/10 w-full"
            onClick={toggle}
          >
            {show ? "Skjul Ahus-internt innhold" : "Vis Ahus-internt innhold"}
          </Button>
        </div>
      )}
    </div>
  );
}
