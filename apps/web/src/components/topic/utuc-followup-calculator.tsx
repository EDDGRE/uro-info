"use client";

import { useState } from "react";

type Pathway = "hoyKirurgisk" | "lavKirurgisk" | "endoskopisk";

const PATHWAY_OPTIONS: { value: Pathway; label: string }[] = [
  {
    value: "hoyKirurgisk",
    label: "Etter NU/ureterreseksjon — høy risiko (≥T2 og/eller N+)",
  },
  {
    value: "lavKirurgisk",
    label: "Etter NU/ureterreseksjon — lav risiko (Ta/T1)",
  },
  { value: "endoskopisk", label: "Etter endoskopisk (nyresparende) behandling" },
];

type Checkpoint = { weeks?: number; months?: number; exams: string[] };

// Transcribert fra Helsedirektoratets handlingsprogram for blære- og urotelkreft, kap. 10.6,
// tabell 13–15 (Haukeland-modell, Bjarte Almås — presentert som ett pragmatisk forslag, ikke en
// skarpt normerende nasjonal anbefaling).
const SCHEDULES: Record<Pathway, Checkpoint[]> = {
  hoyKirurgisk: [
    { weeks: 6, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 4, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
    { months: 8, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 12, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
    { months: 18, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 24, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
    { months: 30, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 36, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
    { months: 42, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 48, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 60, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
  ],
  lavKirurgisk: [
    { weeks: 6, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 4, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 8, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 12, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
    { months: 18, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 24, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 30, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 36, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 42, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 48, exams: ["Blodprøver", "Cystoskopi"] },
    { months: 60, exams: ["Blodprøver", "Cystoskopi", "CT thorax/abdomen"] },
  ],
  endoskopisk: [
    { months: 3, exams: ["URS"] },
    { months: 6, exams: ["URS"] },
    { months: 9, exams: ["Cystoskopi", "CT urografi + thorax"] },
    { months: 12, exams: ["URS"] },
    { months: 18, exams: ["Cystoskopi", "CT urografi + thorax"] },
    { months: 24, exams: ["URS"] },
    { months: 36, exams: ["CT urografi + thorax"] },
    { months: 48, exams: ["CT urografi + thorax"] },
    { months: 60, exams: ["CT urografi + thorax"] },
  ],
};

function addOffset(dateStr: string, cp: Checkpoint): Date {
  const d = new Date(dateStr);
  if (cp.weeks) d.setDate(d.getDate() + cp.weeks * 7);
  if (cp.months) d.setMonth(d.getMonth() + cp.months);
  return d;
}

function offsetLabel(cp: Checkpoint): string {
  if (cp.weeks) return `${cp.weeks} uker`;
  if (cp.months && cp.months % 12 === 0) return `${cp.months / 12} år`;
  return `${cp.months} mnd`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("nb-NO", { year: "numeric", month: "short", day: "numeric" });
}

export function UtucFollowupCalculator() {
  const [pathway, setPathway] = useState<Pathway | "">("");
  const [indexDate, setIndexDate] = useState("");
  const [hasResidiv, setHasResidiv] = useState(false);
  const [residivDate, setResidivDate] = useState("");

  const isEndoskopisk = pathway === "endoskopisk";
  const anchorDate = isEndoskopisk && hasResidiv && residivDate ? residivDate : indexDate;
  const valid = pathway !== "" && anchorDate !== "" && !isNaN(new Date(anchorDate).getTime());

  let checkpoints: { date: Date; monthLabel: string; exams: string[] }[] = [];
  let nextCheckpoint: { date: Date; monthLabel: string; exams: string[] } | null = null;

  if (valid) {
    const today = new Date();
    checkpoints = SCHEDULES[pathway as Pathway].map((cp) => ({
      date: addOffset(anchorDate, cp),
      monthLabel: offsetLabel(cp),
      exams: cp.exams,
    }));
    nextCheckpoint =
      checkpoints.find((c) => c.date >= today) ?? checkpoints[checkpoints.length - 1] ?? null;
  }

  const upcoming = nextCheckpoint ? checkpoints.filter((c) => c.date >= nextCheckpoint!.date) : [];

  return (
    <div className="calc-box">
      <h4>Oppfølgingskalkulator — UTUC (øvre urotelial kreft)</h4>
      <div className="calc-row">
        <label className="calc-field">
          Oppfølgingsløp
          <select value={pathway} onChange={(e) => setPathway(e.target.value as Pathway)}>
            <option value="">Velg</option>
            {PATHWAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="calc-field">
          {isEndoskopisk ? "Dato for behandling" : "Dato for NU/ureterreseksjon"}
          <input type="date" value={indexDate} onChange={(e) => setIndexDate(e.target.value)} />
        </label>
      </div>

      {isEndoskopisk && (
        <>
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
            Residiv oppdaget siden — pasienten rykker tilbake til start av skjemaet
          </label>
          {hasResidiv && (
            <div className="calc-row">
              <label className="calc-field">
                Dato for residiv
                <input
                  type="date"
                  value={residivDate}
                  onChange={(e) => setResidivDate(e.target.value)}
                />
              </label>
            </div>
          )}
        </>
      )}

      {valid && nextCheckpoint ? (
        <>
          <div className="calc-result">
            Neste kontroll: {nextCheckpoint.exams.join(" + ")} —{" "}
            <strong>{formatDate(nextCheckpoint.date)}</strong> ({nextCheckpoint.monthLabel} etter{" "}
            {isEndoskopisk && hasResidiv ? "residiv" : "behandling"})
          </div>
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
                  <td>{c.exams.join(" + ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="calc-result">Velg oppfølgingsløp og dato for å beregne kontrollskjema.</div>
      )}

      <p className="calc-note">
        Basert på Helsedirektoratets handlingsprogram for blære- og urotelkreft, kap. 10.6 (tabell
        13–15) — Haukeland-modellen (Bjarte Almås), gjengitt som ett pragmatisk eksempelskjema, ikke
        en egen skarpt normerende nasjonal anbefaling. Skjemaene for kirurgisk behandling stopper
        ved 5 år uten videre planlagt kontroll i tabellen — vurder avslutning eller individuell
        videre oppfølging klinisk. CT-kontrollene forutsetter at et positivt funn vil ha
        behandlingsmessige konsekvenser — i praksis pasienter &lt;80 år med ECOG 0–1; hos
        eldre/skrøpelige pasienter kan CT-kontrollene utelates.
      </p>
    </div>
  );
}
