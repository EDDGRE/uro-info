"use client";

import { useState } from "react";

export function PsadCalculator() {
  const [psa, setPsa] = useState("");
  const [volume, setVolume] = useState("");

  const psaNum = parseFloat(psa.replace(",", "."));
  const volNum = parseFloat(volume.replace(",", "."));
  const psad = psaNum > 0 && volNum > 0 ? psaNum / volNum : null;

  let verdict: { label: string; warn: boolean } | null = null;
  if (psad !== null) {
    if (psad < 0.1) {
      verdict = { label: "Lav — mindre suspekt for klinisk signifikant kreft", warn: false };
    } else if (psad < 0.15) {
      verdict = { label: "Gråsone — vurder sammen med MR/biopsifunn", warn: false };
    } else {
      verdict = { label: "Forhøyet (≥0.15) — styrker mistanke om signifikant kreft", warn: true };
    }
  }

  return (
    <div className="calc-box">
      <h4>PSAD-kalkulator (PSA-tetthet)</h4>
      <div className="calc-row">
        <label className="calc-field">
          PSA (ng/mL)
          <input
            inputMode="decimal"
            value={psa}
            onChange={(e) => setPsa(e.target.value)}
            placeholder="f.eks. 8,2"
          />
        </label>
        <label className="calc-field">
          Prostatavolum (mL)
          <input
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            placeholder="f.eks. 45"
          />
        </label>
      </div>
      {psad !== null && verdict ? (
        <div className={`calc-result ${verdict.warn ? "warn" : ""}`.trim()}>
          PSAD = {psad.toFixed(3)} ng/mL² — {verdict.label}
        </div>
      ) : (
        <div className="calc-result">
          Fyll inn PSA og prostatavolum (fra MR eller TRUS) for å beregne PSAD.
        </div>
      )}
      <p className="calc-note">
        PSAD = PSA / prostatavolum. Terskel ~0,15 ng/mL² brukes ofte som støtte for biopsibeslutning
        ved gråsone-PSA, sammen med MR-funn (PI-RADS) — erstatter ikke en helhetlig risikovurdering.
      </p>
    </div>
  );
}
