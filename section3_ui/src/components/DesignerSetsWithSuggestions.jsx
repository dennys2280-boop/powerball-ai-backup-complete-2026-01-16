// src/components/DesignerSetsWithSuggestions.jsx
import React, { useMemo } from "react";
import Table4Modern from "./Table4Modern";

/* =========================
   Small UI helpers
   ========================= */

function BallMini({ value, variant = "white" }) {
  // ✅ Smaller than before (clear reduction)
  const base =
    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border";
  const white = `${base} bg-white text-black border-black`;
  const power = `${base} bg-red-600 text-white border-black`;
  return <span className={variant === "power" ? power : white}>{value}</span>;
}

function ComboRow({ combo }) {
  const whites =
    combo?.whites ||
    [combo?.b1, combo?.b2, combo?.b3, combo?.b4, combo?.b5].filter(
      (x) => x !== null && x !== undefined && String(x).trim() !== ""
    );

  const pb =
    combo?.powerball ??
    combo?.pb ??
    (combo?.power !== undefined ? combo.power : "");

  return (
    <div className="flex items-center gap-1 flex-nowrap overflow-x-auto">
      {whites.map((w, i) => (
        <BallMini key={`w-${i}`} value={w} />
      ))}
      <BallMini value={pb} variant="power" />
    </div>
  );
}

/* =========================
   Component
   ========================= */

export default function DesignerSetsWithSuggestions({
  defaultSetName,
  filterContext,
  suggestions = [],
}) {
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  const subtitle = useMemo(() => {
    if (!hasSuggestions) return "Designer Sets + Suggestions (run a search to generate)";
    return `Designer Sets + ${suggestions.length} suggestions`;
  }, [hasSuggestions, suggestions.length]);

  return (
    <div className="app-card p-3">
      <div className="mb-3">
        <div className="text-sm font-semibold">Designer Sets</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        {/* LEFT: Suggested combinations */}
        <div className="min-w-0 border rounded-2xl bg-white overflow-hidden">
          <div className="p-3 border-b bg-gradient-to-b from-white to-gray-50">
            <div className="text-sm font-semibold">Suggested combinations</div>
            <div className="text-xs text-slate-500 mt-1">
              Same format as View Results (PB is red).
            </div>
          </div>

          {!hasSuggestions ? (
            <div className="p-3 text-sm text-slate-600">
              <div className="border rounded-xl p-3 bg-slate-50">
                Run a search + apply filters to generate suggestions.
              </div>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto">
              <div className="divide-y">
                {suggestions.map((s, idx) => (
                  <div key={s.id ?? `s-${idx}`} className="p-2 hover:bg-slate-50">
                    {/* ✅ No numbering */}
                    <ComboRow combo={s} />

                    {"score" in (s || {}) ? (
                      <div className="text-[10px] text-slate-400 mt-1">
                        score: {Number(s.score ?? 0).toFixed(2)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t text-[11px] text-slate-500 bg-white">
            (MVP) Suggestions are client-side only.
          </div>
        </div>

        {/* RIGHT: Designer Sets */}
        <div className="min-w-0">
          <Table4Modern defaultSetName={defaultSetName} filterContext={filterContext} />
        </div>
      </div>
    </div>
  );
}
