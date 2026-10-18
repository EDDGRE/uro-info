"use client";

import { useState } from "react";

const MS_PER_MONTH = (1000 * 60 * 60 * 24 * 365.25) / 12;

type Measurement = { psa: string; date: string };

const EMPTY_MEASUREMENT: Measurement = { psa: "", date: "" };

export function PsaDtCalculator() {
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { ...EMPTY_MEASUREMENT },
    { ...EMPTY_MEASUREMENT },
  ]);

  function updateMeasurement(index: number, field: keyof Measurement, value: string) {
    setMeasurements((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMeasurement() {
    setMeasurements((prev) => [...prev, { ...EMPTY_MEASUREMENT }]);
  }

  function removeMeasurement(index: number) {
    setMeasurements((prev) => prev.filter((_, i) => i !== index));
  }

  const parsed = measurements.map((m) => {
    const psaNum = parseFloat(m.psa.replace(",", "."));
    const date = m.date ? new Date(m.date) : null;
    return psaNum > 0 && date ? { psa: psaNum, time: date.getTime() } : null;
  });
  const filledCount = measurements.filter((m) => m.psa.trim() !== "" || m.date !== "").length;
  const points = parsed
    .filter((p): p is { psa: number; time: number } => p !== null)
    .sort((a, b) => a.time - b.time);
  const n = points.length;
  const valid = n >= 2;

  let dtMonths: number | null = null;
  let r2: number | null = null;
  let rising = false;
  let sameDates = false;
  let spanMonths = 0;

  if (valid) {
    const t0 = points[0]!.time;
    const xs = points.map((p) => (p.time - t0) / MS_PER_MONTH);
    const ys = points.map((p) => Math.log(p.psa));
    spanMonths = xs[xs.length - 1]!;
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i]! - xMean;
      const dy = ys[i]! - yMean;
      sumXY += dx * dy;
      sumXX += dx * dx;
      sumYY += dy * dy;
    }
    sameDates = sumXX === 0;
    const slope = sumXX > 0 ? sumXY / sumXX : NaN;
    rising = slope > 0;
    if (rising) {
      dtMonths = Math.LN2 / slope;
      if (n > 2 && sumYY > 0) {
        const r = sumXY / Math.sqrt(sumXX * sumYY);
        r2 = r * r;
      }
    }
  }

  let verdict: { label: string; warn: boolean } | null = null;
  if (dtMonths !== null) {
    if (dtMonths < 3) {
      verdict = { label: "Svært kort (<3 mnd) — høy aggressivitetsgrad", warn: true };
    } else if (dtMonths < 12) {
      verdict = { label: "Kort (<12 mnd) — tett oppfølging/vurdering tilrådd", warn: true };
    } else {
      verdict = { label: "Lengre (≥12 mnd)", warn: false };
    }
  }

  return (
    <div className="calc-box">
      <h4>PSA-doblingstid</h4>
      {measurements.map((m, i) => (
        <div className="calc-row" key={i}>
          <label className="calc-field">
            {`PSA ${i + 1} (ng/mL)`}
            <input
              inputMode="decimal"
              value={m.psa}
              onChange={(e) => updateMeasurement(i, "psa", e.target.value)}
              placeholder="f.eks. 2,1"
            />
          </label>
          <label className="calc-field">
            {`Dato PSA ${i + 1}`}
            <input
              type="date"
              value={m.date}
              onChange={(e) => updateMeasurement(i, "date", e.target.value)}
            />
          </label>
          {measurements.length > 2 ? (
            <button
              type="button"
              className="calc-remove-row"
              onClick={() => removeMeasurement(i)}
              aria-label={`Fjern måling ${i + 1}`}
            >
              Fjern
            </button>
          ) : null}
        </div>
      ))}
      <button type="button" className="calc-add-row" onClick={addMeasurement}>
        + Legg til måling
      </button>
      {sameDates ? (
        <div className="calc-result">
          To eller flere målinger har samme dato — datoene må være ulike.
        </div>
      ) : valid && !rising ? (
        <div className="calc-result">
          PSA stiger ikke over tid (eller faller) — ingen doblingstid å beregne.
        </div>
      ) : dtMonths !== null && verdict ? (
        <div className={`calc-result ${verdict.warn ? "warn" : ""}`.trim()}>
          PSA-doblingstid ≈ {dtMonths.toFixed(1)} måneder — {verdict.label}
          <span style={{ fontWeight: 400 }}>
            {" "}
            ({n} målinger over {spanMonths.toFixed(1)} mnd
            {r2 !== null ? `, R² = ${r2.toFixed(2)}` : ""})
          </span>
        </div>
      ) : (
        <div className="calc-result">
          Fyll inn minst to PSA-målinger (stigende) med dato for hver, for å beregne doblingstid.
          {filledCount > 0 && !valid
            ? " Sjekk at PSA-verdi og dato er fylt ut for hver måling."
            : ""}
        </div>
      )}
      <p className="calc-note">
        Ved 2 målinger: PSA-DT = (Δt × ln 2) / ln(PSA2/PSA1). Ved 3+ målinger beregnes doblingstiden
        med log-lineær regresjon (minste kvadraters metode på ln(PSA) mot tid) — mer robust mot
        enkeltmålinger med støy/analysevariasjon enn et rent to-punkts estimat. R² (vises ved 3+
        målinger) sier noe om hvor godt punktene faktisk følger en eksponentiell trend — lav R²
        betyr usikkert anslag. Terskelverdiene under er grove støttepunkter (brukt bl.a. ved
        vurdering av biokjemisk residiv og ved aktiv overvåking) — tolkning avhenger alltid av
        klinisk kontekst, ikke tallet alene.
      </p>
    </div>
  );
}
