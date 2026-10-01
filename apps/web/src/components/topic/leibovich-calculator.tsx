"use client";

import { useState } from "react";

const T_STAGE_OPTIONS = [
  { value: "pT1a", label: "pT1a", points: 0 },
  { value: "pT1b", label: "pT1b", points: 2 },
  { value: "pT2", label: "pT2", points: 3 },
  { value: "pT3-T4", label: "pT3a–pT4", points: 4 },
];

const SIZE_OPTIONS = [
  { value: "under10", label: "<10 cm", points: 0 },
  { value: "over10", label: "≥10 cm", points: 1 },
];

const NODE_OPTIONS = [
  { value: "n0", label: "pNx/pN0", points: 0 },
  { value: "n1", label: "pN1/pN2", points: 2 },
];

const GRADE_OPTIONS = [
  { value: "g12", label: "Grad 1–2", points: 0 },
  { value: "g3", label: "Grad 3", points: 1 },
  { value: "g4", label: "Grad 4", points: 3 },
];

const NECROSIS_OPTIONS = [
  { value: "no", label: "Nei", points: 0 },
  { value: "yes", label: "Ja", points: 1 },
];

function findPoints(options: { value: string; points: number }[], value: string) {
  return options.find((o) => o.value === value)?.points;
}

export function LeibovichCalculator() {
  const [tStage, setTStage] = useState("");
  const [size, setSize] = useState("");
  const [nodes, setNodes] = useState("");
  const [grade, setGrade] = useState("");
  const [necrosis, setNecrosis] = useState("");

  const points = [
    findPoints(T_STAGE_OPTIONS, tStage),
    findPoints(SIZE_OPTIONS, size),
    findPoints(NODE_OPTIONS, nodes),
    findPoints(GRADE_OPTIONS, grade),
    findPoints(NECROSIS_OPTIONS, necrosis),
  ];
  const complete = points.every((p) => p !== undefined);
  const total = complete ? (points as number[]).reduce((a, b) => a + b, 0) : null;

  let verdict: { label: string; warn: boolean } | null = null;
  if (total !== null) {
    if (total <= 2) {
      verdict = { label: "Lav risiko (0–2 poeng)", warn: false };
    } else if (total <= 5) {
      verdict = { label: "Intermediær risiko (3–5 poeng)", warn: false };
    } else {
      verdict = { label: "Høy risiko (6–11 poeng)", warn: true };
    }
  }

  return (
    <div className="calc-box">
      <h4>Leibovich-skår (risikostratifisering, klarcellet RCC)</h4>
      <div className="calc-row">
        <label className="calc-field">
          T-stadium
          <select value={tStage} onChange={(e) => setTStage(e.target.value)}>
            <option value="">Velg</option>
            {T_STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="calc-field">
          Tumorstørrelse
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">Velg</option>
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="calc-row">
        <label className="calc-field">
          Regionale lymfeknuter
          <select value={nodes} onChange={(e) => setNodes(e.target.value)}>
            <option value="">Velg</option>
            {NODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="calc-field">
          Kjernegrad
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Velg</option>
            {GRADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="calc-field">
          Tumornekrose
          <select value={necrosis} onChange={(e) => setNecrosis(e.target.value)}>
            <option value="">Velg</option>
            {NECROSIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {verdict ? (
        <div className={`calc-result ${verdict.warn ? "warn" : ""}`.trim()}>
          Leibovich-skår = {total} poeng — {verdict.label}
        </div>
      ) : (
        <div className="calc-result">Fyll inn alle fem felter for å beregne skår.</div>
      )}
      <p className="calc-note">
        Leibovich 2003-skåren er validert for klarcellet RCC etter radikal/partiell nefrektomi, og
        styrer anbefalt oppfølgingsintensitet (se tabell under). Brukes ikke for metastatisk sykdom
        — der gjelder IMDC/Heng-kriteriene.
      </p>
    </div>
  );
}
