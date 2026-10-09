"use client";

import { useState } from "react";

export function PsaDtCalculator() {
  const [psa1, setPsa1] = useState("");
  const [psa2, setPsa2] = useState("");
  const [months, setMonths] = useState("");

  const psa1Num = parseFloat(psa1.replace(",", "."));
  const psa2Num = parseFloat(psa2.replace(",", "."));
  const monthsNum = parseFloat(months.replace(",", "."));

  const valid = psa1Num > 0 && psa2Num > 0 && monthsNum > 0;
  const rising = valid && psa2Num > psa1Num;
  const dtMonths = rising ? (monthsNum * Math.LN2) / Math.log(psa2Num / psa1Num) : null;

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
      <div className="calc-row">
        <label className="calc-field">
          PSA 1 (ng/mL)
          <input
            inputMode="decimal"
            value={psa1}
            onChange={(e) => setPsa1(e.target.value)}
            placeholder="f.eks. 2,1"
          />
        </label>
        <label className="calc-field">
          PSA 2 (ng/mL)
          <input
            inputMode="decimal"
            value={psa2}
            onChange={(e) => setPsa2(e.target.value)}
            placeholder="f.eks. 3,0"
          />
        </label>
        <label className="calc-field">
          Tid mellom målinger (mnd)
          <input
            inputMode="decimal"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            placeholder="f.eks. 6"
          />
        </label>
      </div>
      {valid && !rising ? (
        <div className="calc-result">
          PSA 2 er ikke høyere enn PSA 1 — ingen doblingstid å beregne.
        </div>
      ) : dtMonths !== null && verdict ? (
        <div className={`calc-result ${verdict.warn ? "warn" : ""}`.trim()}>
          PSA-doblingstid ≈ {dtMonths.toFixed(1)} måneder — {verdict.label}
        </div>
      ) : (
        <div className="calc-result">
          Fyll inn to PSA-målinger (stigende) og tiden mellom dem for å beregne doblingstid.
        </div>
      )}
      <p className="calc-note">
        PSA-DT = (Δt × ln 2) / ln(PSA2/PSA1), forutsetter eksponentiell vekst mellom to punkter —
        upresist ved kun to målinger, bruk helst flere datapunkter i praksis. Terskelverdiene over
        er grove støttepunkter (brukt bl.a. ved vurdering av biokjemisk residiv og ved aktiv
        overvåking) — tolkning avhenger alltid av klinisk kontekst, ikke tallet alene.
      </p>
    </div>
  );
}
