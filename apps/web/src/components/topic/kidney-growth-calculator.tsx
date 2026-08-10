"use client";

import { useState } from "react";

export function KidneyGrowthCalculator() {
  const [date1, setDate1] = useState("");
  const [size1, setSize1] = useState("");
  const [date2, setDate2] = useState("");
  const [size2, setSize2] = useState("");

  const d1 = date1 ? new Date(date1) : null;
  const d2 = date2 ? new Date(date2) : null;
  const s1 = parseFloat(size1.replace(",", "."));
  const s2 = parseFloat(size2.replace(",", "."));

  const daysBetween = d1 && d2 ? (d2.getTime() - d1.getTime()) / 86_400_000 : null;
  const datesInvalid = daysBetween !== null && daysBetween <= 0;
  const valid = !!d1 && !!d2 && !datesInvalid && s1 > 0 && s2 > 0;

  let result: { rate: number; pctPerYear: number; years: number } | null = null;
  if (valid && daysBetween) {
    const years = daysBetween / 365.25;
    const rate = (s2 - s1) / years;
    const pctPerYear = ((s2 - s1) / s1 / years) * 100;
    result = { rate, pctPerYear, years };
  }

  return (
    <div className="calc-box">
      <h4>Veksthastighet-kalkulator (nyretumor)</h4>
      <div className="calc-row">
        <label className="calc-field">
          Dato forrige CT/MR
          <input type="date" value={date1} onChange={(e) => setDate1(e.target.value)} />
        </label>
        <label className="calc-field">
          Størrelse forrige (mm)
          <input
            inputMode="decimal"
            value={size1}
            onChange={(e) => setSize1(e.target.value)}
            placeholder="f.eks. 22"
          />
        </label>
      </div>
      <div className="calc-row">
        <label className="calc-field">
          Dato ny CT/MR
          <input type="date" value={date2} onChange={(e) => setDate2(e.target.value)} />
        </label>
        <label className="calc-field">
          Størrelse ny (mm)
          <input
            inputMode="decimal"
            value={size2}
            onChange={(e) => setSize2(e.target.value)}
            placeholder="f.eks. 26"
          />
        </label>
      </div>
      {datesInvalid ? (
        <div className="calc-result warn">Ny undersøkelse må være etter forrige undersøkelse.</div>
      ) : result ? (
        <div className={`calc-result ${result.rate >= 5 ? "warn" : ""}`.trim()}>
          Vekst: {result.rate >= 0 ? "+" : ""}
          {result.rate.toFixed(1)} mm/år ({result.pctPerYear >= 0 ? "+" : ""}
          {result.pctPerYear.toFixed(0)} %/år) over {result.years.toFixed(1)} år
        </div>
      ) : (
        <div className="calc-result">
          Fyll inn dato og størrelse for begge undersøkelser for å beregne vekst.
        </div>
      )}
      <p className="calc-note">
        Lineær vekst &gt;~5 mm/år er brukt i enkelte serier som en av flere faktorer for å vurdere
        overgang fra aktiv overvåkning til aktiv behandling, men vekstrate alene er en svak
        prediktor for metastasepotensiale — vurderes sammen med absolutt størrelse,
        alder/komorbiditet og pasientens ønske.
      </p>
    </div>
  );
}
