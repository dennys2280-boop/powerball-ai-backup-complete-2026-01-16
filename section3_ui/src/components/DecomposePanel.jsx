// src/components/DecomposePanel.jsx
import React, { useMemo, useState } from "react";

function Chip({ children, tone = "gray" }) {
  const cls =
    tone === "red"
      ? "bg-red-600 text-white border-red-700"
      : "bg-white text-gray-900 border-gray-300";

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

/* =========================
   Mini Ball UI (for L/R cells)
   - ✅ paints PB red when item.rightIsPB === true
   ========================= */
function BallMini({ value, isPower = false }) {
  const base =
    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border";
  const white = `${base} bg-white text-gray-900 border-gray-400`;
  const power = `${base} bg-red-600 text-white border-black`;
  return <span className={isPower ? power : white}>{value}</span>;
}

/**
 * TableRangeGrid
 * - bases: [{ base, viewA: [{left,right,count,leftIsPB,rightIsPB}], viewB: [{left,right,count,leftIsPB,rightIsPB}] }, ...]
 * - View A: Light Gray
 * - View B: Dark Gray (Visual Difference)
 * - PB=45: Red In Header (Only When highlightPb45=true And base===45)
 */
function TableRangeGrid({ title, bases, highlightPb45 = false }) {
  // Dynamic height based on the column with more items in A and B
  const metrics = useMemo(() => {
    let maxA = 0;
    let maxB = 0;
    for (const b of bases || []) {
      maxA = Math.max(maxA, b?.viewA?.length || 0);
      maxB = Math.max(maxB, b?.viewB?.length || 0);
    }
    return { maxA, maxB };
  }, [bases]);

  const { maxA, maxB } = metrics;

  // Total rows = A(maxA) + divider(1) + B(maxB)
  const rowsCount = maxA + 1 + maxB;

  const cellBase =
    "px-2 py-1 text-[11px] tabular-nums border-b border-gray-200 whitespace-nowrap";
  const cellA = `${cellBase} bg-gray-50`; // View A
  const cellB = `${cellBase} bg-gray-200`; // View B

  const cellBlankA = `${cellA} text-transparent`;
  const cellBlankB = `${cellB} text-transparent`;

  return (
    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* HEADER */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-gray-900">{title}</div>
            <div className="text-[11px] text-gray-600">
              View A (Light Gray): Ascending Combinations • View B (Dark Gray): Same
              Combinations In Descending Order • PB=45 Highlighted In Red.
              L (Left Correlation) • R (Right Correlation) • C (Count)
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <table className="min-w-max w-full">
          <thead className="sticky top-0 z-10 bg-white">
            {/* Row 1: Base Headers */}
            <tr className="border-b">
              {(bases || []).map((b) => {
                // ✅ FIX: base can be "45" (string), so normalize to number
                const baseNum = Number(b?.base);
                const isPb = highlightPb45 && Number.isFinite(baseNum) && baseNum === 45;

                return (
                  <th
                    key={String(b?.base)}
                    colSpan={3}
                    className="px-2 py-2 text-left border-r last:border-r-0"
                  >
                    <div className="flex items-center gap-2">
                      <Chip tone={isPb ? "red" : "gray"}>{isPb ? "PB 45" : b?.base}</Chip>
                      <span className="text-[11px] text-gray-500">L • R • C</span>
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Row 2: Sub Headers */}
            <tr className="border-b bg-white">
              {(bases || []).map((b) => (
                <React.Fragment key={`sub-${String(b?.base)}`}>
                  <th className="px-2 py-1 text-[11px] text-gray-600 border-r">L</th>
                  <th className="px-2 py-1 text-[11px] text-gray-600 border-r">R</th>

                  {/* "C" with native tooltip */}
                  <th
                    className="px-2 py-1 text-[11px] text-gray-600 border-r last:border-r-0"
                    title="Count"
                  >
                    C
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rowsCount }).map((_, rowIdx) => {
              const isDivider = rowIdx === maxA;

              return (
                <tr key={`r-${rowIdx}`} className={isDivider ? "border-y-2 border-gray-300" : ""}>
                  {(bases || []).map((b) => {
                    if (isDivider) {
                      return (
                        <React.Fragment key={`div-${String(b?.base)}`}>
                          <td className="px-2 py-1 bg-gray-100 border-r" />
                          <td className="px-2 py-1 bg-gray-100 border-r" />
                          <td className="px-2 py-1 bg-gray-100 border-r last:border-r-0" />
                        </React.Fragment>
                      );
                    }

                    const inA = rowIdx < maxA;
                    const idx = inA ? rowIdx : rowIdx - (maxA + 1);

                    const item = inA ? b.viewA?.[idx] : b.viewB?.[idx];

                    const clsL = inA ? cellA : cellB;
                    const clsR = inA ? cellA : cellB;
                    const clsC = inA ? cellA : cellB;

                    const blankL = inA ? cellBlankA : cellBlankB;
                    const blankR = inA ? cellBlankA : cellBlankB;
                    const blankC = inA ? cellBlankA : cellBlankB;

                    const left = item?.left ?? "";
                    const right = item?.right ?? "";
                    const count = item?.count ?? "";

                    // ✅ flags from decomposeCorrelation.js
                    const leftIsPB = Boolean(item?.leftIsPB);
                    const rightIsPB = Boolean(item?.rightIsPB);

                    return (
                      <React.Fragment key={`${String(b?.base)}-${rowIdx}`}>
                        <td className={`${item ? clsL : blankL} border-r`}>
                          {item ? (leftIsPB ? <BallMini value={left} isPower /> : left) : ""}
                        </td>

                        <td className={`${item ? clsR : blankR} border-r`}>
                          {item ? (rightIsPB ? <BallMini value={right} isPower /> : right) : ""}
                        </td>

                        <td
                          className={`${item ? clsC : blankC} border-r last:border-r-0 text-right`}
                        >
                          {count}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER / LEGEND */}
      <div className="px-4 py-3 border-t bg-white">
        <div className="flex items-center gap-4 text-[11px] text-gray-600 flex-wrap">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
            View A (Light Gray)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
            View B (Dark Gray)
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-600 border border-red-700" />
            PB=45
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DecomposePanel({ decompose }) {
  const [tab, setTab] = useState("r1");

  const tabs = [
    { key: "r1", label: "Table 1 (1–9)", start: 1, end: 9 },
    { key: "r2", label: "Table 2 (10–18)", start: 10, end: 18 },
    { key: "r3", label: "Table 3 (19–27)", start: 19, end: 27 },
    { key: "r4", label: "Table 4 (28–36)", start: 28, end: 36 },
    { key: "r5", label: "Table 5 (37–45)", start: 37, end: 45 },
    { key: "r6", label: "Table 6 (46–54)", start: 46, end: 54 },
    { key: "r7", label: "Table 7 (55–63)", start: 55, end: 63 },
    { key: "r8", label: "Table 8 (64–69)", start: 64, end: 69 },
  ];

  const btnBase = "px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors";
  const btnOn = "bg-gray-900 text-white border-gray-900";
  const btnOff = "bg-white text-gray-900 border-gray-200 hover:bg-gray-50";

  const hasRows = (decompose?.totalRows || 0) > 0;

  const allBases = useMemo(() => {
    if (!decompose) return [];
    const t3 = Array.isArray(decompose.table3) ? decompose.table3 : [];
    const t4 = Array.isArray(decompose.table4) ? decompose.table4 : [];
    const t5 = Array.isArray(decompose.table5) ? decompose.table5 : [];
    const t6 = Array.isArray(decompose.table6) ? decompose.table6 : [];
    const t7 = Array.isArray(decompose.table7) ? decompose.table7 : [];
    const all = [...t3, ...t4, ...t5, ...t6, ...t7];

    all.sort((a, b) => Number(a?.base ?? 0) - Number(b?.base ?? 0));
    return all;
  }, [decompose]);

  const current = useMemo(() => {
    if (!decompose) return null;

    const t = tabs.find((x) => x.key === tab) || tabs[0];
    const start = t?.start ?? 1;
    const end = t?.end ?? 9;

    const bases = (allBases || []).filter((b) => {
      const baseNum = Number(b?.base);
      if (!Number.isFinite(baseNum)) return false;
      return baseNum >= start && baseNum <= end;
    });

    const pb45 = start <= 45 && end >= 45;

    return {
      title: `Table — ${start} To ${end}${pb45 ? " (PB=45)" : ""}`,
      bases,
      pb45,
    };
  }, [decompose, tab, allBases]);

  return (
    <div className="mt-4">
      <div className="mb-3">
        <div className="text-[18px] font-bold text-gray-900">DECOMPOSITION</div>
        <div className="text-[11px] text-gray-600">
          Left/Right Correlation By Position (Ball 1–5) Using Filtered Results From Filters.
          Automatic Updates.
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`${btnBase} ${tab === t.key ? btnOn : btnOff}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!hasRows ? (
        <div className="border rounded-2xl bg-white p-6 text-[12px] text-gray-600">
          No Data Yet. Run A <span className="font-semibold">Search</span> In Filters
          To Generate Correlations.
        </div>
      ) : (
        <TableRangeGrid
          title={current?.title}
          bases={current?.bases || []}
          highlightPb45={current?.pb45}
        />
      )}
    </div>
  );
}
