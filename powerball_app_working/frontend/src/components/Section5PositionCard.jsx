// src/components/Section5PositionCard.jsx
import React, { useMemo, useState } from "react";
import { buildRankedView } from "../hooks/useSection5SortController.js";

function titleCase(s) {
  return String(s || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatCombo(combo) {
  const arr = Array.isArray(combo) ? combo : [];
  return arr.join("-");
}

export default function Section5PositionCard({
  title,
  posKey,
  rows,
  sort,
  onSortChange,
  onApplyThisToAll,
}) {
  const [rankLimit, setRankLimit] = useState(10);

  const effectiveSort = sort || { column: "count", dir: "desc" };

  const ranked = useMemo(() => buildRankedView(rows, effectiveSort, rankLimit), [rows, effectiveSort, rankLimit]);
  const rankedSet = useMemo(() => new Set(ranked.map((r) => r?.number)), [ranked]);

  return (
    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-gray-900">{title}</div>
            <div className="text-[11px] text-gray-600">
              {titleCase("Excel index is fixed 1–69. Sorting affects ranked view only.")}
            </div>
          </div>
        </div>

        {/* Per-table sort controls */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="text-[11px] font-semibold text-gray-700">{titleCase("Sort Options")}</div>

          <select className="border rounded-lg px-2 py-1 text-[11px]" value="count" disabled>
            <option value="count">Count</option>
          </select>

          <select
            className="border rounded-lg px-2 py-1 text-[11px]"
            value={effectiveSort.dir}
            onChange={(e) => onSortChange?.({ column: "count", dir: e.target.value })}
            title={titleCase("Direction")}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <button
            type="button"
            className="border rounded-lg px-2 py-1 text-[11px] bg-gray-50 hover:bg-gray-100"
            onClick={() => onApplyThisToAll?.(effectiveSort)}
            title={titleCase("Apply This Sort To All Tables")}
          >
            {titleCase("Apply To All Tables")}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="text-[11px] text-gray-600">{titleCase("Rank Limit")}</div>
            <select
              className="border rounded-lg px-2 py-1 text-[11px]"
              value={rankLimit}
              onChange={(e) => setRankLimit(Number(e.target.value) || 10)}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Ranked View */}
        <div className="mt-2">
          <div className="text-[11px] font-semibold text-gray-800">{titleCase("Ranked View")}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {ranked.length === 0 ? (
              <span className="text-[11px] text-gray-500">{titleCase("No Data")}</span>
            ) : (
              ranked.map((r) => (
                <span
                  key={`${posKey}-${r.number}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] bg-white"
                  title={`${titleCase("Number")}: ${r.number} • ${titleCase("Count")}: ${r.count}`}
                >
                  <span className="font-semibold text-gray-900">{r.number}</span>
                  <span className="text-gray-500">({r.count})</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: 520 }}>
        <table className="min-w-max w-full">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b">
              <th className="px-2 py-2 text-left text-[11px] text-gray-600">{titleCase("Excel Index")}</th>
              <th className="px-2 py-2 text-left text-[11px] text-gray-600">{titleCase("Number")}</th>
              <th className="px-2 py-2 text-left text-[11px] text-gray-600">{titleCase("Count")}</th>
              <th className="px-2 py-2 text-left text-[11px] text-gray-600">{titleCase("Filtered Combinations")}</th>
            </tr>
          </thead>

          <tbody>
            {(rows || []).map((r) => {
              const isRanked = rankedSet.has(r?.number);
              const combos = Array.isArray(r?.combinations) ? r.combinations : [];

              const preview = combos.slice(0, 3).map(formatCombo).join(", ");
              const more = combos.length > 3 ? ` … (+${combos.length - 3} more)` : "";

              return (
                <tr key={`${posKey}-${r.excelIndex}`} className={isRanked ? "bg-yellow-50" : ""}>
                  <td className="px-2 py-1 text-[11px] tabular-nums border-b whitespace-nowrap">{r.excelIndex}</td>
                  <td className="px-2 py-1 text-[11px] tabular-nums border-b whitespace-nowrap">{r.number}</td>
                  <td className="px-2 py-1 text-[11px] tabular-nums border-b whitespace-nowrap">{r.count}</td>
                  <td
                    className="px-2 py-1 text-[11px] border-b whitespace-nowrap max-w-[420px]"
                    title={combos.slice(0, 50).map(formatCombo).join(" | ")}
                  >
                    <span className="text-gray-900">{preview || "—"}</span>
                    {more ? <span className="text-gray-500">{more}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
