// src/components/SidebarFilters.jsx
import React, { useMemo } from "react";

/**
 * SidebarFilters (RightSidebar)
 * - Tabs: Filter / Sort
 * - Mantiene el modelo de reglas y sorts que ya estás usando en Table1.jsx
 * - SOLO UI. No toca API. No toca layout principal.
 */

const COLUMN_OPTIONS = [
  { key: "white1", label: "Bola 1" },
  { key: "white2", label: "Bola 2" },
  { key: "white3", label: "Bola 3" },
  { key: "white4", label: "Bola 4" },
  { key: "white5", label: "Bola 5" },
  { key: "powerball", label: "Powerball" },
  { key: "draw_date", label: "Date" },
];

const RULE_TYPE_OPTIONS = [
  { key: "number", label: "Number" },
  { key: "date", label: "Date" },
  { key: "cell", label: "Cell" },
];

function uid() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function defaultRule() {
  return {
    id: uid(),
    column: "white1",
    ruleType: "number",
    op: "equals",
    v1: "",
    v2: "",
  };
}

function humanizeRule(rule) {
  const colLabel = COLUMN_OPTIONS.find((c) => c.key === rule?.column)?.label ?? rule?.column;

  if (rule?.ruleType === "date") {
    if (rule?.op === "before" && rule?.v1) return `${colLabel} antes de ${rule.v1}`;
    if (rule?.op === "after" && rule?.v1) return `${colLabel} después de ${rule.v1}`;
    if (rule?.op === "between" && rule?.v1 && rule?.v2)
      return `${colLabel} entre ${rule.v1} y ${rule.v2}`;
    return `${colLabel} (filtro de fecha)`;
  }

  if (rule?.ruleType === "number") {
    if (rule?.op === "equals" && rule?.v1) return `${colLabel} igual a ${rule.v1}`;
    if (rule?.op === "greater" && rule?.v1) return `${colLabel} mayor que ${rule.v1}`;
    if (rule?.op === "less" && rule?.v1) return `${colLabel} menor que ${rule.v1}`;
    if (rule?.op === "between" && rule?.v1 && rule?.v2)
      return `${colLabel} entre ${rule.v1} y ${rule.v2}`;
    return `${colLabel} (filtro numérico)`;
  }

  if (rule?.op === "contains" && rule?.v1) return `${colLabel} contiene "${rule.v1}"`;
  if (rule?.op === "equals" && rule?.v1) return `${colLabel} igual a "${rule.v1}"`;
  return `${colLabel} (filtro de celda)`;
}

export default function SidebarFilters({
  open,
  activeTab,
  setActiveTab,
  onClose,

  filterRules,
  setFilterRules,
  filterMatchMode,
  setFilterMatchMode,

  sortRules,
  setSortRules,
}) {
  const w = open ? "w-80" : "w-0";
  const bodyOpacity = open ? "opacity-100" : "opacity-0 pointer-events-none";

  const safeFilterRules = useMemo(() => (Array.isArray(filterRules) ? filterRules : []), [filterRules]);
  const safeSortRules = useMemo(() => (Array.isArray(sortRules) ? sortRules : []), [sortRules]);

  const addFilter = () => setFilterRules((prev) => [...(Array.isArray(prev) ? prev : []), defaultRule()]);
  const removeFilter = (id) => setFilterRules((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== id) : []));
  const updateFilter = (id, patch) =>
    setFilterRules((prev) =>
      (Array.isArray(prev) ? prev : []).map((r) => (r.id === id ? { ...r, ...patch } : r))
    );

  const addSort = () =>
    setSortRules((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: uid(), column: "draw_date", direction: "asc" },
    ]);

  const removeSort = (id) =>
    setSortRules((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []));

  const updateSort = (id, patch) =>
    setSortRules((prev) =>
      (Array.isArray(prev) ? prev : []).map((s) => (s.id === id ? { ...s, ...patch } : s))
    );

  return (
    <div className={`h-full ${w} transition-all duration-200 border-l bg-white overflow-hidden`}>
      <div className={`h-full flex flex-col ${bodyOpacity} transition-opacity duration-200`}>
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">{activeTab === "filter" ? "Filter" : "Sort"}</div>
          <button
            type="button"
            className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-3 border-b flex gap-2">
          <button
            type="button"
            className={`px-3 py-1 rounded border text-sm font-semibold ${
              activeTab === "filter" ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("filter")}
          >
            Filter
          </button>

          <button
            type="button"
            className={`px-3 py-1 rounded border text-sm font-semibold ${
              activeTab === "sort" ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("sort")}
          >
            Sort
          </button>
        </div>

        {activeTab === "filter" ? (
          <div className="p-3 space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-70">Reglas por columna (Numbers-like)</div>
              <button
                type="button"
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50 font-semibold"
                onClick={addFilter}
              >
                Add Filter
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="opacity-70">Match:</span>
              <select
                className="border rounded px-2 py-1"
                value={filterMatchMode}
                onChange={(e) => setFilterMatchMode(e.target.value)}
              >
                <option value="all">all (AND)</option>
                <option value="any">any (OR)</option>
              </select>
            </div>

            {safeFilterRules.length === 0 ? (
              <div className="border rounded p-3 text-sm opacity-70">
                No filters yet. Click <span className="font-semibold">Add Filter</span>.
              </div>
            ) : (
              <div className="space-y-3">
                {safeFilterRules.map((r) => {
                  const isDate = r.ruleType === "date";
                  const isNumber = r.ruleType === "number";
                  const isCell = r.ruleType === "cell";

                  const opOptions = isDate
                    ? [
                        { key: "before", label: "before" },
                        { key: "after", label: "after" },
                        { key: "between", label: "between" },
                      ]
                    : isNumber
                    ? [
                        { key: "equals", label: "equal" },
                        { key: "greater", label: "greater" },
                        { key: "less", label: "less" },
                        { key: "between", label: "between" },
                      ]
                    : [
                        { key: "contains", label: "contains" },
                        { key: "equals", label: "equal" },
                      ];

                  return (
                    <div key={r.id} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Rule</div>
                        <button
                          type="button"
                          className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                          onClick={() => removeFilter(r.id)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <div className="text-xs opacity-70 mb-1">Column</div>
                          <select
                            className="w-full border rounded px-2 py-2 text-sm"
                            value={r.column}
                            onChange={(e) => updateFilter(r.id, { column: e.target.value })}
                          >
                            {COLUMN_OPTIONS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs opacity-70 mb-1">Choose a Rule</div>
                          <select
                            className="w-full border rounded px-2 py-2 text-sm"
                            value={r.ruleType}
                            onChange={(e) =>
                              updateFilter(r.id, {
                                ruleType: e.target.value,
                                op: e.target.value === "date" ? "between" : "equals",
                                v1: "",
                                v2: "",
                              })
                            }
                          >
                            {RULE_TYPE_OPTIONS.map((t) => (
                              <option key={t.key} value={t.key}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs opacity-70 mb-1">Operator</div>
                          <select
                            className="w-full border rounded px-2 py-2 text-sm"
                            value={r.op}
                            onChange={(e) => updateFilter(r.id, { op: e.target.value })}
                          >
                            {opOptions.map((o) => (
                              <option key={o.key} value={o.key}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs opacity-70 mb-1">Value</div>
                            <input
                              className="w-full border rounded px-2 py-2 text-sm"
                              type={isDate ? "date" : isNumber ? "number" : "text"}
                              value={r.v1}
                              onChange={(e) => updateFilter(r.id, { v1: e.target.value })}
                              placeholder={isCell ? "text..." : ""}
                            />
                          </div>

                          <div>
                            <div className="text-xs opacity-70 mb-1">Value 2</div>
                            <input
                              className="w-full border rounded px-2 py-2 text-sm"
                              type={isDate ? "date" : isNumber ? "number" : "text"}
                              value={r.v2}
                              onChange={(e) => updateFilter(r.id, { v2: e.target.value })}
                              disabled={r.op !== "between"}
                              placeholder={r.op === "between" ? "" : "—"}
                            />
                          </div>
                        </div>

                        <div className="text-xs opacity-60">
                          Preview: <span className="font-semibold">{humanizeRule(r)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-70">Multi-sort (Numbers-like)</div>
              <button
                type="button"
                className="text-sm px-3 py-1 border rounded hover:bg-gray-50 font-semibold"
                onClick={addSort}
              >
                Add Sort
              </button>
            </div>

            {safeSortRules.length === 0 ? (
              <div className="border rounded p-3 text-sm opacity-70">
                No sorts yet. Click <span className="font-semibold">Add Sort</span>.
              </div>
            ) : (
              <div className="space-y-3">
                {safeSortRules.map((s, i) => (
                  <div key={s.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Sort #{i + 1}</div>
                      <button
                        type="button"
                        className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                        onClick={() => removeSort(s.id)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-xs opacity-70 mb-1">Column</div>
                        <select
                          className="w-full border rounded px-2 py-2 text-sm"
                          value={s.column}
                          onChange={(e) => updateSort(s.id, { column: e.target.value })}
                        >
                          {COLUMN_OPTIONS.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs opacity-70 mb-1">Direction</div>
                        <select
                          className="w-full border rounded px-2 py-2 text-sm"
                          value={s.direction}
                          onChange={(e) => updateSort(s.id, { direction: e.target.value })}
                        >
                          <option value="asc">ascending</option>
                          <option value="desc">descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
