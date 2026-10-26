"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, Lock } from "lucide-react";

import { Button, Input } from "@uro-info/ui";

import { useAhusVisibility } from "@/lib/use-ahus-visibility";
import { useAhusAuth } from "@/lib/use-ahus-auth";

export function AhusToggle() {
  const { show, hydrated, toggle } = useAhusVisibility();
  const { unlocked, checked, submitPassword } = useAhusAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "wrong">("idle");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setStatus("checking");
    const ok = await submitPassword(password);
    if (!ok) setStatus("wrong");
    // on success submitPassword reloads the page itself
  }

  const label = unlocked
    ? "Ahus-internt innhold — klikk for å lese mer og skru av/på"
    : "Ahus-internt innhold — passordbeskyttet, klikk for å låse opp";

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-expanded={open}
        className="text-inherit hover:bg-white/10"
        onClick={() => setOpen((o) => !o)}
      >
        {checked && !unlocked ? (
          <Lock className="h-4 w-4 text-[#dd93b8] opacity-70" />
        ) : (
          <Building2
            className={`h-4 w-4 text-[#dd93b8] ${hydrated && !show ? "opacity-40" : ""}`}
          />
        )}
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
          {unlocked ? (
            <>
              <p className="mb-3 text-[12.5px] leading-snug opacity-85">
                Besøkende fra andre sykehus: bygningsikonet kan aktiveres for å skjule innhold
                merket «Ahus internt» da dette muligens ikke samsvarer med eksterne rutiner.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-internal text-internal hover:bg-internal/10 w-full"
                onClick={toggle}
              >
                {show ? "Skjul Ahus-internt innhold" : "Vis Ahus-internt innhold"}
              </Button>
            </>
          ) : (
            <>
              <p className="mb-3 text-[12.5px] leading-snug opacity-85">
                Oppgi passordet for å få tilgang til internt innhold for Ahus-ansatte.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Input
                  type="password"
                  autoComplete="off"
                  placeholder="Ahus-passord"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setStatus("idle");
                  }}
                  className="border-internal bg-background text-sm"
                />
                {status === "wrong" && (
                  <p className="text-[11.5px] text-red-500">Feil passord — prøv igjen.</p>
                )}
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={status === "checking" || !password}
                  className="border-internal text-internal hover:bg-internal/10 w-full"
                >
                  {status === "checking" ? "Sjekker…" : "Lås opp"}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
