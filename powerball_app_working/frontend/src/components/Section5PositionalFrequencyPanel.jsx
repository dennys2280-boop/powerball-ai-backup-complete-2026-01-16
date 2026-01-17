// src/components/Section5PositionalFrequencyPanel.jsx
import React, { useMemo, useState } from "react";
import { useSection5SortController } from "../hooks/useSection5SortController.js";
import Section5PositionCard from "./Section5PositionCard.jsx";

const POS_META = [
  { key: "pos1", title: "Position 1" },
  { key: "pos2", title: "Position 2" },
  { key: "pos3", title: "Position 3" },
  { key: "pos4", title: "Position 4" },
  { key: "pos5", title: "Position 5" },
  { key: "pos6", title: "Position 6 (Powerball)" },
];

function titleCase(s) {
  return String(s || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Section5PositionalFrequencyPanel({ section5 }) {
  const tables = section5?.tables || {};
  const sortCtl = useSection5SortController();
  const [showCustom, setShowCustom] = useState(false);

  const global = sortCtl.globalSort || { column: "count", dir: "desc" };

  const rowCount = Number(section5?.count || 0);

  const customRulesUi = useMemo(() => {
    const rules = Array.isArray(sortCtl.customRules) ? sortCtl.customRules : [];
    return rules.map((r, idx) => ({
      idx,
      posKey: POS_META.some((p) => p.key === r?.posKey) ? r.posKey : "pos1",
      column: r?.column === "count" ? "count" : "count",
      dir: r?.dir === "asc" ? "asc" : "desc",
    }));
  }, [sortCtl.customRules]);

  const setCustomRuleAt = (idx, patch) => {
    const next = [...customRulesUi].map((r) => ({ ...r }));
    const target = next[idx];
    if (!target) return;
    next[idx] = { ...target, ...patch };

    // Save back to controller
    sortCtl.actions.setCustomRules(
      next.map((r) => ({ posKey: r.posKey, column: r.column, dir: r.dir }))
    );
  };

  const addCustomRule = () => {
    const next = [...customRulesUi, { idx: Date.now(), posKey: "pos1", column: "count", dir: "desc" }];
    sortCtl.actions.setCustomRules(next.map((r) => ({ posKey: r.posKey, column: r.column, dir: r.dir })));
  };

  const removeCustomRule = (idx) => {
    const next = customRulesUi.filter((r) => r.idx !== idx);
    sortCtl.actions.setCustomRules(next.map((r) => ({ posKey: r.posKey, column: r.column, dir: r.dir })));
  };

  return (
    <div className="p-4">
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">Section 5 — Positional Frequency Analysis</div>
            <div className="text-[11px] text-gray-500">
              {titleCase("progressive decomposition by position using filtered results")} • {rowCount} Rows
            </div>
          </div>

          {/* Global Sort Bar */}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <div className="text-[11px] font-semibold text-gray-700">{titleCase("sort options")}</div>

            <select
              className="border rounded-lg px-2 py-1 text-[11px]"
              value={global.column}
              onChange={(e) => sortCtl.actions.setGlobalSort({ ...global, column: e.target.value })}
              title={titleCase("sortable columns")}
            >
              <option value="count">Count</option>
            </select>

            <select
              className="border rounded-lg px-2 py-1 text-[11px]"
              value={global.dir}
              onChange={(e) => sortCtl.actions.setGlobalSort({ ...global, dir: e.target.value })}
              title={titleCase("direction")}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>

            <button
              type="button"
              className="border rounded-lg px-2 py-1 text-[11px] bg-gray-50 hover:bg-gray-100"
              onClick={() => sortCtl.actions.applyToAllTables(global)}
              title={titleCase("apply sort to all tables")}
            >
              {titleCase("apply to all tables")}
            </button>

            <button
              type="button"
              className="border rounded-lg px-2 py-1 text-[11px] bg-white hover:bg-gray-50"
              onClick={sortCtl.actions.resetAll}
              title={titleCase("reset sort")}
            >
              {titleCase("reset")}
            </button>

            <button
              type="button"
              className="border rounded-lg px-2 py-1 text-[11px] bg-white hover:bg-gray-50"
              onClick={() => setShowCustom((v) => !v)}
              title={titleCase("custom sort rules")}
            >
              {titleCase(showCustom ? "hide custom rules" : "custom sort rules")}
            </button>
          </div>

          {/* Custom mapping */}
          {showCustom ? (
            <div className="mt-2 border rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-gray-800">{titleCase("custom sort rules")}</div>
                <button
                  type="button"
                  className="border rounded-lg px-2 py-1 text-[11px] bg-gray-50 hover:bg-gray-100"
                  onClick={addCustomRule}
                >
                  + {titleCase("rule")}
                </button>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2">
                {customRulesUi.length === 0 ? (
                  <div className="text-[11px] text-gray-500">{titleCase("no custom rules defined")}</div>
                ) : null}

                {customRulesUi.map((r) => (
                  <div key={r.idx} className="flex flex-wrap items-center gap-2">
                    <select
                      className="border rounded-lg px-2 py-1 text-[11px]"
                      value={r.posKey}
                      onChange={(e) => setCustomRuleAt(r.idx, { posKey: e.target.value })}
                    >
                      {POS_META.map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.title}
                        </option>
                      ))}
                    </select>

                    <select className="border rounded-lg px-2 py-1 text-[11px]" value="count" disabled>
                      <option value="count">Count</option>
                    </select>

                    <select
                      className="border rounded-lg px-2 py-1 text-[11px]"
                      value={r.dir}
                      onChange={(e) => setCustomRuleAt(r.idx, { dir: e.target.value })}
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>

                    <button
                      type="button"
                      className="border rounded-lg px-2 py-1 text-[11px] bg-white hover:bg-gray-50"
                      onClick={() => removeCustomRule(r.idx)}
                    >
                      {titleCase("remove")}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-[10px] text-gray-500">
                {titleCase("custom rules override per-table and global sort")}
              </div>
            </div>
          ) : null}
        </div>

        {/* Tables grid */}
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-max grid grid-flow-col auto-cols-[minmax(340px,1fr)] gap-3">
            {POS_META.map((p) => (
              <Section5PositionCard
                key={p.key}
                title={p.title}
                posKey={p.key}
                rows={tables?.[p.key] || []}
                sort={sortCtl.resolveSortForTable(p.key)}
                onSortChange={(next) => sortCtl.actions.setTableSort(p.key, next)}
                onApplyThisToAll={(next) => sortCtl.actions.applyToAllTables(next)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
