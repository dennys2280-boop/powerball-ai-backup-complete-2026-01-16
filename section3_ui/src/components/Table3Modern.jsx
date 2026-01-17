// src/components/Table3Modern.jsx
import React, { useEffect, useMemo, useState } from "react";
import DecomposePanel from "../components/DecomposePanel";

/* =========================
   Ball UI
   ========================= */

function BallModern({ value, variant = "white", matchedA = false }) {
  const base =
    "inline-flex items-center justify-center w-8 h-8 rounded-full text-[12px] font-bold border";

  const white = `${base} bg-white text-black border-black`;
  const power = `${base} bg-red-600 text-white border-black`;
  const ring = matchedA ? " ring-2 ring-yellow-400" : "";

  return <span className={`${variant === "power" ? power : white}${ring}`}>{value}</span>;
}

/* =========================
   Helpers
   ========================= */

function toSet(v) {
  if (!v) return new Set();
  if (v instanceof Set) return v;
  if (Array.isArray(v)) return new Set(v.map(Number));
  return new Set();
}

function buildFreqMap(rows, keys) {
  const map = new Map();
  for (const r of rows || []) {
    for (const k of keys) {
      const n = Number(r?.[k]);
      if (!Number.isFinite(n) || n <= 0) continue;
      map.set(n, (map.get(n) || 0) + 1);
    }
  }
  return map;
}

function freqToRows(freqMap, min, max) {
  const out = [];
  for (let i = min; i <= max; i++) {
    const c = freqMap.get(i) || 0;
    if (c > 0) out.push({ n: i, c });
  }
  return out;
}

function SimpleCountTable({ title, leftHeader, data }) {
  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div className="px-3 py-2 border-b bg-gray-50">
        <div className="text-[12px] font-semibold text-gray-800">{title}</div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-[11px] leading-tight">
          <thead className="sticky top-0 bg-white border-b">
            <tr className="text-gray-600">
              <th className="px-3 py-1 text-left font-semibold">{leftHeader}</th>
              <th className="px-3 py-1 text-right font-semibold">Count</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="px-3 py-2 text-gray-500" colSpan={2}>
                  No data
                </td>
              </tr>
            ) : (
              data.map((x) => (
                <tr key={x.n} className="border-b last:border-b-0">
                  <td className="px-3 py-1 font-semibold tabular-nums">{x.n}</td>
                  <td className="px-3 py-1 text-right tabular-nums">{x.c}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
   ========================= */

export default function Table3Modern({
  apiCount = 0,
  shownCount = 0,
  loading = false,
  err = "",
  rows = [],
  hasAnyA = false,
  matchA,
  // ✅ opcional: si algún día quieres renderizar Decompose dentro de Table3Modern,
  // pásalo por props. Si no viene, NO rompe.
  decompose = null,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [qaSort, setQaSort] = useState("desc");

  const aWhites = useMemo(() => toSet(matchA?.whites), [matchA]);
  const aPb = matchA?.pb ?? null;

  /* =========================
     Frequency
     ========================= */

  const whiteFreq = useMemo(
    () => buildFreqMap(rows, ["white1", "white2", "white3", "white4", "white5"]),
    [rows]
  );
  const pbFreq = useMemo(() => buildFreqMap(rows, ["powerball"]), [rows]);

  const whiteRows = useMemo(() => {
    const base = freqToRows(whiteFreq, 1, 69);
    return [...base].sort((a, b) => (qaSort === "asc" ? a.c - b.c : b.c - a.c));
  }, [whiteFreq, qaSort]);

  const pbRows = useMemo(() => {
    const base = freqToRows(pbFreq, 1, 26);
    return [...base].sort((a, b) => (qaSort === "asc" ? a.c - b.c : b.c - a.c));
  }, [pbFreq, qaSort]);

  /* =========================
     Shortcuts
     ========================= */

  useEffect(() => {
    const onKeyDownGlobal = (e) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      const k = String(e.key || "").toLowerCase();

      if (k === "r") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
      if (k === "q" && !collapsed) {
        e.preventDefault();
        setQaOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKeyDownGlobal, true);
    return () => window.removeEventListener("keydown", onKeyDownGlobal, true);
  }, [collapsed]);

  /* =========================
     RENDER
     ========================= */

  return (
    <div className="h-full bg-yellow-50/70 border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b bg-yellow-100/60">
        <div className="flex justify-between">
          <div>
            <div className="text-base font-semibold">Filter Results</div>
            <div className="text-[12px] text-gray-700 mt-1">
              Results: <b>{apiCount}</b> • Shown: <b>{shownCount}</b>
              {loading ? <span> • loading…</span> : null}
              {err ? <span className="text-red-600"> • {String(err)}</span> : null}
            </div>
          </div>

          <button
            className="px-2 py-1 text-[8px] border rounded bg-white"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-x-hidden">
        {collapsed ? (
          <div className="p-8 text-center text-[8px] text-gray-600">Results Hidden</div>
        ) : (
          <>
            {/* TABLE */}
            {rows.length > 0 && (
              <table className="w-auto text-[8px]">
                <tbody>
                  {rows.map((r, idx) => {
                    const nums = [r.white1, r.white2, r.white3, r.white4, r.white5].map(Number);
                    const pb = Number(r.powerball);

                    return (
                      <tr key={idx} className="border-b">
                        <td className="px-2">{r.draw_date}</td>
                        <td className="px-2">
                          <div className="flex gap-2">
                            {nums.map((n, i) => (
                              <BallModern key={i} value={n} matchedA={hasAnyA && aWhites.has(n)} />
                            ))}
                            <BallModern value={pb} variant="power" matchedA={hasAnyA && pb === aPb} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* (Opcional) Frequency QA */}
            {qaOpen ? (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-semibold text-gray-800">Quick Analysis</div>
                  <button
                    className="px-2 py-1 text-[8px] border rounded bg-white"
                    onClick={() => setQaSort((v) => (v === "asc" ? "desc" : "asc"))}
                  >
                    Sort: {qaSort}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SimpleCountTable title="Whites frequency" leftHeader="Number" data={whiteRows} />
                  <SimpleCountTable title="Powerball frequency" leftHeader="PB" data={pbRows} />
                </div>
              </div>
            ) : null}

            {/* =========================
               SECTION 4 — DECOMPOSE (OPTIONAL)
               ========================= */}
            {decompose ? (
              <div className="mt-6 border-t pt-4">
                <div className="px-3 mb-2">
                  <div className="text-[10px] font-semibold">
                    SECTION 4 — DECOMPOSE (Correlation Analysis)
                  </div>
                  <div className="text-[8px] text-gray-600">
                    Co-ocurrencia histórica • combinaciones ordenadas • sin predicción
                  </div>
                </div>

                <DecomposePanel decompose={decompose} defaultBase={12} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
