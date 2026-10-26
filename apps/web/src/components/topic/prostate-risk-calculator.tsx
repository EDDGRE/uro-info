"use client";

import { useState } from "react";

type TStage = "t1c-t2a" | "t2b" | "t2c" | "t3-t4";

const T_OPTIONS: { value: TStage; label: string }[] = [
  { value: "t1c-t2a", label: "cT1c–T2a" },
  { value: "t2b", label: "cT2b" },
  { value: "t2c", label: "cT2c" },
  { value: "t3-t4", label: "cT3–T4" },
];

type Tier = "low" | "mid" | "high";

type RiskResult = {
  group: string;
  tier: Tier;
  staging: string;
};

// EAU/Helsedirektoratets risikogruppering (ikke-metastatisk sykdom) — samme kategorier som
// risikogruppetabellen i fanen over. Lokalavansert og lokalisert høyrisiko, samt favorittene
// eksplisitt listet i tabellen, gir identisk klassifisering her. For kombinasjoner tabellen ikke
// eksplisitt eksemplifiserer (f.eks. PSA 10–20 alene med ISUP 1) brukes standard EAU-prinsippet:
// ett enkelt intermediær-kriterium (PSA 10–20, ISUP 2–3, eller cT2b) gir gunstig intermediær
// risiko, mens ISUP 3 eller ≥2 kriterier samtidig gir ugunstig intermediær risiko.
function classify(psa: number, isup: number, tStage: TStage, nPlus: boolean): RiskResult {
  const stagingHigh =
    "Staging for lymfeknute-/skjelettspredning er indisert. PSMA-PET/CT er førstevalg der " +
    "tilgjengelig (ev. MR med kartlegging av lymfeknuter og skjelett der PSMA-PET ikke er " +
    "tilgjengelig).";

  if (tStage === "t3-t4" || nPlus) {
    return { group: "Høy risiko — lokalavansert", tier: "high", staging: stagingHigh };
  }
  if (isup >= 4 || psa > 20 || tStage === "t2c") {
    return { group: "Høy risiko — lokalisert", tier: "high", staging: stagingHigh };
  }

  const intermediateFactors = [psa >= 10 && psa <= 20, isup === 2 || isup === 3, tStage === "t2b"]
    .filter(Boolean).length;

  if (intermediateFactors >= 1) {
    const unfavorable = isup === 3 || intermediateFactors >= 2;
    return {
      group: unfavorable ? "Intermediær risiko — ugunstig" : "Intermediær risiko — gunstig",
      tier: "mid",
      staging: unfavorable
        ? stagingHigh.replace("er indisert", "bør vurderes")
        : "Supplerende metastaseutredning er normalt ikke nødvendig, men kan vurderes individuelt.",
    };
  }

  return {
    group: "Lav risiko",
    tier: "low",
    staging: "Supplerende metastaseutredning er normalt ikke indisert.",
  };
}

export function ProstateRiskCalculator() {
  const [psaInput, setPsaInput] = useState("");
  const [isup, setIsup] = useState("");
  const [tStage, setTStage] = useState<TStage | "">("");
  const [nPlus, setNPlus] = useState(false);

  const psa = parseFloat(psaInput.replace(",", "."));
  const valid = psaInput !== "" && !isNaN(psa) && psa >= 0 && isup !== "" && tStage !== "";

  const result = valid ? classify(psa, Number(isup), tStage as TStage, nPlus) : null;

  return (
    <div className="calc-box">
      <h4>Risikokalkulator — EAU-risikogruppering og PSMA-PET-indikasjon</h4>
      <div className="calc-row">
        <label className="calc-field">
          PSA (ng/mL)
          <input
            type="text"
            inputMode="decimal"
            placeholder="f.eks. 7.4"
            value={psaInput}
            onChange={(e) => setPsaInput(e.target.value)}
          />
        </label>
        <label className="calc-field">
          ISUP-gradgruppe (biopsi)
          <select value={isup} onChange={(e) => setIsup(e.target.value)}>
            <option value="">Velg</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </label>
        <label className="calc-field">
          Klinisk T-stadium (DRE)
          <select value={tStage} onChange={(e) => setTStage(e.target.value as TStage)}>
            <option value="">Velg</option>
            {T_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
        <input type="checkbox" checked={nPlus} onChange={(e) => setNPlus(e.target.checked)} />
        cN+ (mistenkt/bekreftet lymfeknutespredning på bildediagnostikk)
      </label>

      {result ? (
        <>
          <div className={`calc-result ${result.tier}`}>
            <strong>{result.group}</strong>
          </div>
          <div className="calc-result" style={{ marginTop: "8px" }}>
            {result.staging}
          </div>
        </>
      ) : (
        <div className="calc-result">Fyll inn PSA, ISUP-gradgruppe og klinisk T-stadium.</div>
      )}

      <p className="calc-note">
        Risikogruppering følger EAU/Helsedirektoratets kategorier for ikke-metastatisk sykdom —
        samme kategorier som i risikogruppetabellen over. Ved grensetilfeller tabellen ikke
        eksplisitt eksemplifiserer er klassifiseringen basert på standard EAU-prinsipp: ett enkelt
        intermediær-kriterium (PSA 10–20, ISUP 2–3, eller cT2b) gir gunstig intermediær risiko,
        mens ISUP 3 eller ≥2 kriterier samtidig gir ugunstig intermediær risiko — dobbeltsjekk
        klinisk ved tvil. Klinisk T-stadium settes på DRE, ikke MR-funn. Anbefalingen om
        supplerende bildediagnostikk er en forenkling av teksten over, ikke en erstatning for
        individuell/MDT-vurdering.
      </p>
    </div>
  );
}
