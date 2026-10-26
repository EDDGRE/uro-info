"use client";

import { useState } from "react";

type RiskGroup = "lav" | "intermediar" | "hoy";

const RISK_OPTIONS: { value: RiskGroup; label: string }[] = [
  { value: "lav", label: "Lav risiko (primær, solitær, Ta LG, <3 cm, ingen CIS)" },
  { value: "intermediar", label: "Intermediær risiko (Ta LG, men multiple/residiv/>3 cm)" },
  { value: "hoy", label: "Høy risiko (T1, høygradig, eller CIS — inkl. intermediær + HG)" },
];

// Checkpoint months after the anchor date (siste TURB/re-TURB, eller residiv-dato),
// transcribed from Helsedirektoratets handlingsprogram for blære- og urotelkreft, tabell 8
// (kap. 10.2, sist faglig endring 24. april 2026). Intervaller er regnet fra TURB-datoen,
// ikke stablet fra forrige kontroll — se note i kalkulatoren.
const SCHEDULES: Record<RiskGroup, number[]> = {
  lav: [3, 12, 24],
  intermediar: [3, 6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 108, 120],
  hoy: [3, 6, 9, 12, 15, 18, 21, 24, 30, 36, 42, 48, 54, 60, 72, 84, 96, 108, 120, 132, 144],
};

const WHAT_LABEL: Record<RiskGroup, string> = {
  lav: "Cystoskopi",
  intermediar: "Cystoskopi",
  hoy: "Cystoskopi + cytologi",
};

function addMonths(dateStr: string, months: number): Date {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("nb-NO", { year: "numeric", month: "short", day: "numeric" });
}

function yearsLabel(months: number): string {
  if (months < 12) return `${months} mnd`;
  const years = months / 12;
  return Number.isInteger(years) ? `${years} år` : `${months} mnd`;
}

export function NmibcFollowupCalculator() {
  const [riskGroup, setRiskGroup] = useState<RiskGroup | "">("");
  const [turbDate, setTurbDate] = useState("");
  const [hasResidiv, setHasResidiv] = useState(false);
  const [residivDate, setResidivDate] = useState("");
  const [residivRiskGroup, setResidivRiskGroup] = useState<RiskGroup | "">("");

  const anchorDate = hasResidiv && residivDate ? residivDate : turbDate;
  const effectiveRisk = hasResidiv ? residivRiskGroup : riskGroup;
  const valid = effectiveRisk !== "" && anchorDate !== "" && !isNaN(new Date(anchorDate).getTime());

  let checkpoints: { date: Date; monthLabel: string }[] = [];
  let nextCheckpoint: { date: Date; monthLabel: string } | null = null;
  let ctInfo: { next: Date; recurring: boolean } | null = null;

  if (valid) {
    const risk = effectiveRisk as RiskGroup;
    const today = new Date();
    checkpoints = SCHEDULES[risk].map((m) => ({
      date: addMonths(anchorDate, m),
      monthLabel: yearsLabel(m),
    }));
    nextCheckpoint =
      checkpoints.find((c) => c.date >= today) ?? checkpoints[checkpoints.length - 1] ?? null;

    if (risk === "hoy") {
      // Kontrastforsterket CT urinveier hvert 2. år, første gang 1 år etter avsluttet behandling.
      let ctDate = addMonths(anchorDate, 12);
      while (ctDate < today) {
        ctDate = new Date(ctDate);
        ctDate.setFullYear(ctDate.getFullYear() + 2);
      }
      ctInfo = { next: ctDate, recurring: true };
    }
  }

  const upcoming = nextCheckpoint
    ? checkpoints.filter((c) => c.date >= nextCheckpoint!.date).slice(0, 6)
    : [];

  return (
    <div className="calc-box">
      <h4>Oppfølgingskalkulator — NMIBC (ikke-muskelinfiltrerende blærekreft)</h4>
      <div className="calc-row">
        <label className="calc-field">
          Risikogruppe
          <select value={riskGroup} onChange={(e) => setRiskGroup(e.target.value as RiskGroup)}>
            <option value="">Velg</option>
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="calc-field">
          Dato for siste TURB/re-TURB
          <input type="date" value={turbDate} onChange={(e) => setTurbDate(e.target.value)} />
        </label>
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--ink-soft)",
          marginBottom: "10px",
        }}
      >
        <input
          type="checkbox"
          checked={hasResidiv}
          onChange={(e) => setHasResidiv(e.target.checked)}
        />
        Residiv oppdaget siden — oppfølgingen gjenopptas med kontroll 3 mnd. etter residiv-dato
      </label>

      {hasResidiv && (
        <div className="calc-row">
          <label className="calc-field">
            Dato for residiv (ny TURB/funn)
            <input
              type="date"
              value={residivDate}
              onChange={(e) => setResidivDate(e.target.value)}
            />
          </label>
          <label className="calc-field">
            Ny risikogruppe (etter residiv — aldri lav)
            <select
              value={residivRiskGroup}
              onChange={(e) => setResidivRiskGroup(e.target.value as RiskGroup)}
            >
              <option value="">Velg</option>
              <option value="intermediar">Intermediær</option>
              <option value="hoy">Høy</option>
            </select>
          </label>
        </div>
      )}

      {valid && nextCheckpoint ? (
        <>
          <div className="calc-result">
            Neste kontroll: {WHAT_LABEL[effectiveRisk as RiskGroup]} —{" "}
            <strong>{formatDate(nextCheckpoint.date)}</strong> ({nextCheckpoint.monthLabel} etter{" "}
            {hasResidiv ? "residiv" : "TURB"})
          </div>
          {ctInfo && (
            <div className="calc-result" style={{ marginTop: "-6px" }}>
              CT urinveier (høyrisiko, hvert 2. år): <strong>{formatDate(ctInfo.next)}</strong>
            </div>
          )}
          <table className="datatable" style={{ marginTop: "10px", fontSize: "12.5px" }}>
            <tbody>
              <tr>
                <th>Tidspunkt</th>
                <th>Dato</th>
                <th>Kontroll</th>
              </tr>
              {upcoming.map((c, i) => (
                <tr key={i}>
                  <td>{c.monthLabel}</td>
                  <td>{formatDate(c.date)}</td>
                  <td>{WHAT_LABEL[effectiveRisk as RiskGroup]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="calc-result">
          Velg risikogruppe og dato for siste TURB/re-TURB for å beregne kontrollskjema.
        </div>
      )}

      <p className="calc-note">
        Basert på Helsedirektoratets handlingsprogram for blære- og urotelkreft, kap. 10.2 (tabell
        8, sist faglig endring 24. april 2026) — se kildelisten under for lenke. Intervallene over
        er regnet fra TURB/residiv-datoen (ikke stablet fra forrige kontroll), som er den mest
        nærliggende lesningen av kildens formulering, men dobbeltsjekk mot teksten i kap. 10.2 ved
        tvil. Lavrisikoskjemaet stopper ved år 2 uten videre planlagt kontroll i tabellen — vurder
        avslutning eller forlenget individuell oppfølging klinisk. Høy alder, dårlig
        allmenntilstand, komorbiditet eller psykososiale forhold kan tilsi at kontrollene avsluttes
        tidligere.
      </p>
    </div>
  );
}
