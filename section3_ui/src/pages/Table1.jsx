// src/pages/Table1.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchTable1 } from "../lib/powerballApi";
import TopControlsPanel from "../components/TopControlsPanel";
import Table3Modern from "../components/Table3Modern";
import Table4Modern from "../components/Table4Modern";
import Section5PositionalFrequencyPanel from "../components/Section5PositionalFrequencyPanel.jsx";
import { generateSuggestionsFromRows } from "../lib/suggestions";
import { useFilterResults } from "../context/FilterResultsContext.jsx";

/* =========================
   Helpers
   ========================= */

function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pad2(n) {
  const s = String(n ?? "").trim();
  return s.padStart(2, "0");
}

function getMonthDay(drawDate) {
  if (!drawDate) return null;
  const s = String(drawDate).trim();

  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[2]}-${iso[3]}`;

  const us = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) return `${pad2(us[1])}-${pad2(us[2])}`;

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  return null;
}

function getWeekday(drawDate) {
  if (!drawDate) return null;
  const d = new Date(drawDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

function yyyy_mm_dd(y, m, d) {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMatchConfig({ white1, white2, white3, white4, white5, powerball }) {
  const w = [
    toIntOrNull(white1),
    toIntOrNull(white2),
    toIntOrNull(white3),
    toIntOrNull(white4),
    toIntOrNull(white5),
  ].filter((n) => n !== null);

  return {
    whites: new Set(w),
    pb: toIntOrNull(powerball),
  };
}

/* =========================
   Numbers-like Sidebar model
   ========================= */

const COLUMN_OPTIONS = [
  { key: "white1", label: "Ball 1" },
  { key: "white2", label: "Ball 2" },
  { key: "white3", label: "Ball 3" },
  { key: "white4", label: "Ball 4" },
  { key: "white5", label: "Ball 5" },
  { key: "powerball", label: "Powerball" },
  { key: "draw_date", label: "Draw date" },
];

const RULE_TYPE_OPTIONS = [
  { key: "number", label: "Number" },
  { key: "date", label: "Date" },
  { key: "cell", label: "Cell" },
];

function defaultRule() {
  return {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : String(Date.now() + Math.random()),
    column: "white1",
    ruleType: "number",
    op: "equals",
    v1: "",
    v2: "",
  };
}

function parseDateValue(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function applyRule(row, rule) {
  const col = rule.column;
  const raw = row?.[col];

  if (rule.ruleType === "date") {
    const t = parseDateValue(raw);
    const a = parseDateValue(rule.v1);
    const b = parseDateValue(rule.v2);

    if (t === null) return false;
    if (rule.op === "before") return a !== null ? t < a : true;
    if (rule.op === "after") return a !== null ? t > a : true;
    if (rule.op === "between") {
      if (a === null || b === null) return true;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return t >= lo && t <= hi;
    }
    return true;
  }

  if (rule.ruleType === "number") {
    const n = Number(raw);
    const a = toIntOrNull(rule.v1);
    const b = toIntOrNull(rule.v2);

    if (!Number.isFinite(n)) return false;

    if (rule.op === "equals") return a !== null ? n === a : true;
    if (rule.op === "greater") return a !== null ? n > a : true;
    if (rule.op === "less") return a !== null ? n < a : true;
    if (rule.op === "between") {
      if (a === null || b === null) return true;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return n >= lo && n <= hi;
    }
    return true;
  }

  const s = String(raw ?? "");
  const q = String(rule.v1 ?? "");
  if (rule.op === "contains") return q ? s.toLowerCase().includes(q.toLowerCase()) : true;
  if (rule.op === "equals") return q ? s.toLowerCase() === q.toLowerCase() : true;
  return true;
}

function applyFilters(rows, filterRules, matchMode) {
  if (!filterRules?.length) return rows || [];
  const mode = matchMode === "any" ? "any" : "all";

  return (rows || []).filter((row) => {
    if (mode === "all") return filterRules.every((r) => applyRule(row, r));
    return filterRules.some((r) => applyRule(row, r));
  });
}

function applyMultiSort(rows, sorts) {
  const arr = [...(rows || [])];
  if (!sorts?.length) return arr;

  const cmp = (a, b, col, dir) => {
    const av = a?.[col];
    const bv = b?.[col];

    if (col === "draw_date") {
      const at = parseDateValue(av) ?? 0;
      const bt = parseDateValue(bv) ?? 0;
      return dir === "desc" ? bt - at : at - bt;
    }

    const an = Number(av);
    const bn = Number(bv);
    const bothNums = Number.isFinite(an) && Number.isFinite(bn);
    if (bothNums) return dir === "desc" ? bn - an : an - bn;

    const as = String(av ?? "");
    const bs = String(bv ?? "");
    return dir === "desc" ? bs.localeCompare(as) : as.localeCompare(bs);
  };

  arr.sort((a, b) => {
    for (const s of sorts) {
      const d = cmp(a, b, s.column, s.direction);
      if (d !== 0) return d;
    }
    return 0;
  });

  return arr;
}

function humanizeRule(rule) {
  const colLabel = COLUMN_OPTIONS.find((c) => c.key === rule.column)?.label ?? rule.column;

  if (rule.ruleType === "date") {
    if (rule.op === "before" && rule.v1) return `${colLabel} before ${rule.v1}`;
    if (rule.op === "after" && rule.v1) return `${colLabel} after ${rule.v1}`;
    if (rule.op === "between" && rule.v1 && rule.v2)
      return `${colLabel} between ${rule.v1} and ${rule.v2}`;
    return `${colLabel} (date filter)`;
  }

  if (rule.ruleType === "number") {
    if (rule.op === "equals" && rule.v1) return `${colLabel} equals ${rule.v1}`;
    if (rule.op === "greater" && rule.v1) return `${colLabel} greater than ${rule.v1}`;
    if (rule.op === "less" && rule.v1) return `${colLabel} less than ${rule.v1}`;
    if (rule.op === "between" && rule.v1 && rule.v2)
      return `${colLabel} between ${rule.v1} and ${rule.v2}`;
    return `${colLabel} (number filter)`;
  }

  if (rule.op === "contains" && rule.v1) return `${colLabel} contains "${rule.v1}"`;
  if (rule.op === "equals" && rule.v1) return `${colLabel} equals "${rule.v1}"`;
  return `${colLabel} (cell filter)`;
}

function defaultSetNameFromFilters(filterRules) {
  const active = (filterRules || []).filter(
    (r) => (r.v1 && String(r.v1).trim() !== "") || (r.v2 && String(r.v2).trim() !== "")
  );
  if (!active.length) return "New designed combinations (no filters)";
  const parts = active.map(humanizeRule);
  return `New designed combinations with ${parts.join(", ")}`;
}

/* =========================
   Sidebar UI (right)
   ========================= */

function RightSidebar({
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

  const btnBase = "px-3 py-1 rounded border text-sm font-semibold transition-colors select-none";
  const btnInactive = "bg-white text-gray-900 hover:bg-gray-50";
  const btnActive = "bg-gray-900 text-white border-gray-600 hover:bg-gray-900";
  const btnCls = (isActive) => `${btnBase} ${isActive ? btnActive : btnInactive}`;

  const smallBtnBase = "text-sm px-2 py-1 border rounded transition-colors select-none";
  const smallBtnInactive = "bg-white text-gray-900 hover:bg-gray-50";
  const smallBtnActive = "bg-gray-900 text-white border-gray-900 hover:bg-gray-900";
  const smallBtnCls = (isActive) =>
    `${smallBtnBase} ${isActive ? smallBtnActive : smallBtnInactive}`;

  const addFilter = () => setFilterRules((prev) => [...prev, defaultRule()]);
  const addSort = () =>
    setSortRules((prev) => [
      ...prev,
      {
        id: globalThis.crypto?.randomUUID
          ? globalThis.crypto.randomUUID()
          : String(Date.now() + Math.random()),
        column: "draw_date",
        direction: "asc",
      },
    ]);

  return (
    <div
      className={`fixed right-12 top-[88px] bottom-4 ${w} transition-all duration-200 border-l bg-gray-300 overflow-hidden shadow-sm z-40`}
    >
      <div className={`h-full flex flex-col ${bodyOpacity} transition-opacity duration-200`}>
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">{activeTab === "filter" ? "Filter" : "Sort"}</div>
          <button type="button" className={smallBtnCls(false)} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-3 border-b flex gap-2">
          <button
            type="button"
            className={btnCls(activeTab === "filter")}
            onClick={() => setActiveTab("filter")}
          >
            Filter
          </button>

          <button
            type="button"
            className={btnCls(activeTab === "sort")}
            onClick={() => setActiveTab("sort")}
          >
            Sort
          </button>
        </div>

        {activeTab === "filter" ? (
          <div className="p-3 space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs opacity-70">Column rules (Numbers-like)</div>
              <button type="button" className={`${btnBase} ${btnInactive}`} onClick={addFilter}>
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

            {filterRules.length === 0 ? (
              <div className="border rounded p-3 text-sm opacity-70">
                No filters yet. Click <span className="font-semibold">Add Filter</span>.
              </div>
            ) : (
              <div className="space-y-3">
                {filterRules.map((r) => {
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

                  const updateFilterLocal = (id, patch) =>
                    setFilterRules((prev) =>
                      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
                    );

                  const removeFilterLocal = (id) =>
                    setFilterRules((prev) => prev.filter((x) => x.id !== id));

                  return (
                    <div key={r.id} className="border rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Rule</div>
                        <button
                          type="button"
                          className={smallBtnCls(false)}
                          onClick={() => removeFilterLocal(r.id)}
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
                            onChange={(e) => updateFilterLocal(r.id, { column: e.target.value })}
                          >
                            {COLUMN_OPTIONS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs opacity-70 mb-1">Rule type</div>
                          <select
                            className="w-full border rounded px-2 py-2 text-sm"
                            value={r.ruleType}
                            onChange={(e) =>
                              updateFilterLocal(r.id, {
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
                            onChange={(e) => updateFilterLocal(r.id, { op: e.target.value })}
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
                              onChange={(e) => updateFilterLocal(r.id, { v1: e.target.value })}
                              placeholder={isCell ? "text..." : ""}
                            />
                          </div>

                          <div>
                            <div className="text-xs opacity-70 mb-1">Value 2</div>
                            <input
                              className="w-full border rounded px-2 py-2 text-sm"
                              type={isDate ? "date" : isNumber ? "number" : "text"}
                              value={r.v2}
                              onChange={(e) => updateFilterLocal(r.id, { v2: e.target.value })}
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
              <button type="button" className={`${btnBase} ${btnInactive}`} onClick={addSort}>
                Add Sort
              </button>
            </div>

            {sortRules.length === 0 ? (
              <div className="border rounded p-3 text-sm opacity-70">
                No sorts yet. Click <span className="font-semibold">Add Sort</span>.
              </div>
            ) : (
              <div className="space-y-3">
                {sortRules.map((s, i) => (
                  <div key={s.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Sort #{i + 1}</div>
                      <button
                        type="button"
                        className={smallBtnCls(false)}
                        onClick={() => setSortRules((prev) => prev.filter((x) => x.id !== s.id))}
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
                          onChange={(e) =>
                            setSortRules((prev) =>
                              prev.map((x) =>
                                x.id === s.id ? { ...x, column: e.target.value } : x
                              )
                            )
                          }
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
                          onChange={(e) =>
                            setSortRules((prev) =>
                              prev.map((x) =>
                                x.id === s.id ? { ...x, direction: e.target.value } : x
                              )
                            )
                          }
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

/* =========================
   Page
   ========================= */

function safeParseJSON(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

const TABLE1_FILTER_STATE_KEY = "table1:numbers_like_filters:v1";

export default function Table1Page({ extension }) {
  const [scope, setScope] = useState("history");
  const [operator, setOperator] = useState("AND");

  // ✅ FilterResults context (MUST be inside component)
  // ✅ FIX: also read filteredRows/meta so Table1 can rehydrate after navigation
  const { filteredRows, meta, setFilteredRows, setMeta } = useFilterResults();

  // Combo A
  const [white1, setWhite1] = useState("");
  const [white2, setWhite2] = useState("");
  const [white3, setWhite3] = useState("");
  const [white4, setWhite4] = useState("");
  const [white5, setWhite5] = useState("");
  const [powerball, setPowerball] = useState("");

  // Combo B
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [bWhite1, setBWhite1] = useState("");
  const [bWhite2, setBWhite2] = useState("");
  const [bWhite3, setBWhite3] = useState("");
  const [bWhite4, setBWhite4] = useState("");
  const [bWhite5, setBWhite5] = useState("");
  const [bPowerball, setBPowerball] = useState("");

  // Date filters (history)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Month/day across years
  const [matchMonthDay, setMatchMonthDay] = useState(false);
  const [monthDayMonth, setMonthDayMonth] = useState("12");
  const [monthDayDay, setMonthDayDay] = useState("24");

  // Weekday
  const [weekdayOnly, setWeekdayOnly] = useState("");

  // Options
  const [complete, setComplete] = useState(true);
  const [sort, setSort] = useState("draw_date");
  const [direction, setDirection] = useState("asc");
  const [limit, setLimit] = useState(200);

  // Results
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [lastUrl, setLastUrl] = useState("");

  // ✅ FIX: Rehydrate Table1 table after route navigation (prevents "looks like clear")
  useEffect(() => {
    // if table already has data, don't overwrite
    if (Array.isArray(items) && items.length > 0) return;

    // only rehydrate if context belongs to table1 and has rows
    if (meta?.source !== "table1") return;

    const ctxRows = Array.isArray(filteredRows) ? filteredRows : [];
    if (ctxRows.length === 0) return;

    setItems(ctxRows);
    setCount(ctxRows.length);
  }, [filteredRows, meta, items]);

  // Sidebar (right)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("filter");

  // Filters + sort models
  const [filterRules, setFilterRules] = useState([]);
  const [filterMatchMode, setFilterMatchMode] = useState("all");
  const [sortRules, setSortRules] = useState([]);

  // ✅ Persist + restore Numbers-like sidebar state (filter/sort) across navigation
  const didHydrateSidebarStateRef = useRef(false);

  useEffect(() => {
    const raw = globalThis?.localStorage?.getItem?.(TABLE1_FILTER_STATE_KEY);
    const parsed = safeParseJSON(raw);

    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.filterRules)) setFilterRules(parsed.filterRules);
      if (parsed.filterMatchMode === "all" || parsed.filterMatchMode === "any")
        setFilterMatchMode(parsed.filterMatchMode);
      if (Array.isArray(parsed.sortRules)) setSortRules(parsed.sortRules);
    }

    didHydrateSidebarStateRef.current = true;
  }, []);

  useEffect(() => {
    if (!didHydrateSidebarStateRef.current) return;

    const payload = {
      filterRules: Array.isArray(filterRules) ? filterRules : [],
      filterMatchMode: filterMatchMode === "any" ? "any" : "all",
      sortRules: Array.isArray(sortRules) ? sortRules : [],
    };

    try {
      globalThis?.localStorage?.setItem?.(TABLE1_FILTER_STATE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors (private mode / quota / etc)
    }
  }, [filterRules, filterMatchMode, sortRules]);

  // ✅ Overlay position (anchored to the hovered AREA container)
  const [overlayPos, setOverlayPos] = useState(null);

  // ✅ Refs to anchor the overlay exactly over the hovered area (red box)
  const suggestedBoxRef = useRef(null);
  const designerBoxRef = useRef(null);

  const showMonthDay = scope === "history";

  const matchA = useMemo(
    () => buildMatchConfig({ white1, white2, white3, white4, white5, powerball }),
    [white1, white2, white3, white4, white5, powerball]
  );

  const matchB = useMemo(
    () =>
      buildMatchConfig({
        white1: bWhite1,
        white2: bWhite2,
        white3: bWhite3,
        white4: bWhite4,
        white5: bWhite5,
        powerball: bPowerball,
      }),
    [bWhite1, bWhite2, bWhite3, bWhite4, bWhite5, bPowerball]
  );

  const hasAnyA = matchA.whites.size > 0 || matchA.pb !== null;
  const hasAnyB = matchB.whites.size > 0 || matchB.pb !== null;

  const setOverlayFromRef = (ref) => {
    const el = ref?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const PANEL_W = 360;
    const GAP = 16;
    let left = rect.left - PANEL_W - GAP;
    if (left < 8) left = rect.right + GAP;

    setOverlayPos({
      top: rect.top,
      left,
    });
  };

  async function onSearch() {
    setErr("");
    setLoading(true);

    try {
      const monthDayEnabled = showMonthDay && matchMonthDay;
      const effectiveLimit = monthDayEnabled ? 8000 : toIntOrNull(limit) ?? 200;

      const params = {
        white1: toIntOrNull(white1),
        white2: toIntOrNull(white2),
        white3: toIntOrNull(white3),
        white4: toIntOrNull(white4),
        white5: toIntOrNull(white5),
        powerball: toIntOrNull(powerball),

        date_from: monthDayEnabled ? null : scope === "history" ? dateFrom || null : null,
        date_to: monthDayEnabled ? null : scope === "history" ? dateTo || null : null,

        complete: complete ? 1 : 0,
        sort,
        direction,
        output: "json",
        limit: effectiveLimit,
      };

      const res = await fetchTable1(scope, operator, params);

      let rows = res?.data || [];
      let c = res?.count ?? rows.length;

      if (monthDayEnabled) {
        const target = `${pad2(monthDayMonth)}-${pad2(monthDayDay)}`;
        rows = rows.filter((r) => getMonthDay(r?.draw_date) === target);
        c = rows.length;
      }

      if (weekdayOnly) {
        const want = weekdayOnly === "mon" ? 1 : weekdayOnly === "fri" ? 5 : null;
        if (want !== null) {
          rows = rows.filter((r) => getWeekday(r?.draw_date) === want);
          c = rows.length;
        }
      }

      setItems(rows);
      setCount(c);
      setLastUrl(res?.url || "");
    } catch (e) {
      setItems([]);
      setCount(0);
      setLastUrl("");
      setErr(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    // Inputs (Combo A)
    setWhite1("");
    setWhite2("");
    setWhite3("");
    setWhite4("");
    setWhite5("");
    setPowerball("");

    // Date filters
    setDateFrom("");
    setDateTo("");

    // Inputs (Combo B)
    setBWhite1("");
    setBWhite2("");
    setBWhite3("");
    setBWhite4("");
    setBWhite5("");
    setBPowerball("");

    // ✅ Clear Filter Results (Numbers-like sidebar)
    setFilterRules([]);
    setFilterMatchMode("all");
    setSortRules([]);

    // ✅ Clear persisted Numbers-like sidebar state
    try {
      globalThis?.localStorage?.removeItem?.(TABLE1_FILTER_STATE_KEY);
    } catch {
      // ignore
    }

    // ✅ Clear Results (so table is not showing previous filtered/search results)
    setItems([]);
    setCount(0);
    setLastUrl("");
    setErr("");

    // ✅ Clear Suggested hover/compare state (avoid “sticky” panels)
    setHoveredSuggestionId(null);
    setHoveredHistoryMatchesBySuggestionId({});
    setHoveredFutureMatchesBySuggestionId({});
    setHistoricalCompareEnabled(false);
    setFutureCompareEnabled(false);

    // ✅ Clear Designer comparisons state
    setDesignerCompareMode(null);
    setHoveredDesignerRow(null);
    setDesignerFilteredMatchesByRowId({});
    setDesignerSuggestedMatchesByRowId({});

    // ✅ Clear Designer Set table itself (Table4Modern internal state)
    setTimeout(() => {
      designerTableRef.current?.clearTable?.();
    }, 0);

    // ✅ clear FilterResultsContext (force)
    setFilteredRows([], { force: true });
    setMeta(
      {
        source: "table1",
        updatedAt: new Date().toISOString(),
        count: 0,
      },
      { force: true }
    );
  }

  function onPreset(id) {
    const now = new Date();
    const y = now.getFullYear();

    if (id === "christmas_week") {
      setScope("history");
      setMatchMonthDay(false);
      setWeekdayOnly("");
      setDateFrom(yyyy_mm_dd(y, 12, 24));
      setDateTo(yyyy_mm_dd(y, 12, 31));
      return;
    }

    if (id === "halloween") {
      setScope("history");
      setMatchMonthDay(false);
      setWeekdayOnly("");
      setDateFrom(yyyy_mm_dd(y, 10, 24));
      setDateTo(yyyy_mm_dd(y, 10, 31));
      return;
    }

    if (id === "fri_only") {
      setWeekdayOnly("fri");
      return;
    }

    if (id === "mon_only") {
      setWeekdayOnly("mon");
      return;
    }
  }

  function onExportCSV() {
    const rows = items || [];
    const headers = ["draw_date", "white1", "white2", "white3", "white4", "white5", "powerball"];
    const lines = [headers.join(",")];

    for (const r of rows) {
      const vals = headers.map((h) => {
        const v = r?.[h] ?? "";
        const s = String(v).replaceAll('"', '""');
        return `"${s}"`;
      });
      lines.push(vals.join(","));
    }

    downloadBlob(`powerball_export_${scope}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  }

  function onExportExcel() {
    const rows = items || [];
    const headers = ["draw_date", "white1", "white2", "white3", "white4", "white5", "powerball"];
    const lines = [headers.join("\t")];

    for (const r of rows) {
      const vals = headers.map((h) => String(r?.[h] ?? ""));
      lines.push(vals.join("\t"));
    }

    downloadBlob(
      `powerball_export_${scope}.xls`,
      lines.join("\n"),
      "application/vnd.ms-excel;charset=utf-8"
    );
  }

  // ✅ Active-only rules
  const activeFilterRules = useMemo(() => {
    return (filterRules || []).filter((r) => {
      const v1 = String(r?.v1 ?? "").trim();
      const v2 = String(r?.v2 ?? "").trim();
      return v1 !== "" || v2 !== "";
    });
  }, [filterRules]);

  // Apply Numbers-like filters + multi-sort (client-side)
  const filteredItems = useMemo(() => {
    const afterFilter = applyFilters(items, activeFilterRules, filterMatchMode);
    const afterSort = applyMultiSort(afterFilter, sortRules);
    return afterSort;
  }, [items, activeFilterRules, filterMatchMode, sortRules]);

  // ✅ Sync filteredItems -> FilterResultsContext (AUTO)
  // ✅ FIX: context blocks empty updates unless force, so force only when empty to avoid stale
  useEffect(() => {
    const rows = Array.isArray(filteredItems) ? filteredItems : [];
    if (rows.length === 0) {
      setFilteredRows([], { force: true });
      setMeta(
        {
          source: "table1",
          updatedAt: new Date().toISOString(),
          count: 0,
        },
        { force: true }
      );
      return;
    }

    setFilteredRows(rows);
    setMeta({
      source: "table1",
      updatedAt: new Date().toISOString(),
      count: rows.length,
    });
  }, [filteredItems, setFilteredRows, setMeta]);

  const shownCount = filteredItems.length;

  const defaultSetName = useMemo(
    () => defaultSetNameFromFilters(activeFilterRules),
    [activeFilterRules]
  );

  // ✅ Suggestions: 150 each time filtered results change
  const suggestions = useMemo(() => {
    if (!filteredItems || filteredItems.length === 0) return [];
    return generateSuggestionsFromRows(filteredItems, { count: 150 });
  }, [filteredItems]);

  /* =========================
     Comparison (Historical/Future) for Suggested combinations
     ========================= */

  const [historicalCompareEnabled, setHistoricalCompareEnabled] = useState(false);
  const [historyAllRows, setHistoryAllRows] = useState([]);
  const [historyAllLoading, setHistoryAllLoading] = useState(false);

  const [futureCompareEnabled, setFutureCompareEnabled] = useState(false);
  const [futureAllRows, setFutureAllRows] = useState([]);
  const [futureAllLoading, setFutureAllLoading] = useState(false);

  const [hoveredSuggestionId, setHoveredSuggestionId] = useState(null);

  const [hoveredHistoryMatchesBySuggestionId, setHoveredHistoryMatchesBySuggestionId] = useState(
    {}
  );
  const [hoveredFutureMatchesBySuggestionId, setHoveredFutureMatchesBySuggestionId] = useState(
    {}
  );

  function normalizeWhitesArray(wArr) {
    return (wArr || []).map((x) => Number(x)).filter((n) => Number.isFinite(n));
  }

  async function fetchFullHistoryByYear() {
    const startYear = 1992;
    const endYear = new Date().getFullYear();

    const all = [];
    const seen = new Set();

    for (let y = startYear; y <= endYear; y++) {
      const params = {
        white1: null,
        white2: null,
        white3: null,
        white4: null,
        white5: null,
        powerball: null,
        date_from: `${y}-01-01`,
        date_to: `${y}-12-31`,
        complete: 1,
        sort: "draw_date",
        direction: "asc",
        output: "json",
        limit: 2000,
      };

      const res = await fetchTable1("history", "AND", params);
      const rows = res?.data || [];

      for (const r of rows) {
        const k = `${r?.draw_date ?? ""}|${r?.white1 ?? ""}|${r?.white2 ?? ""}|${r?.white3 ?? ""}|${
          r?.white4 ?? ""
        }|${r?.white5 ?? ""}|${r?.powerball ?? ""}`;
        if (!seen.has(k)) {
          seen.add(k);
          all.push(r);
        }
      }
    }

    return all;
  }

  async function fetchAllFutureDraws() {
    const params = {
      white1: null,
      white2: null,
      white3: null,
      white4: null,
      white5: null,
      powerball: null,
      date_from: null,
      date_to: null,
      complete: 1,
      sort: "draw_date",
      direction: "asc",
      output: "json",
      limit: 8000,
    };

    const res = await fetchTable1("future", "AND", params);
    const rows = res?.data || [];

    const seen = new Set();
    const all = [];

    for (const r of rows) {
      const k = `${r?.draw_date ?? ""}|${r?.white1 ?? ""}|${r?.white2 ?? ""}|${r?.white3 ?? ""}|${
        r?.white4 ?? ""
      }|${r?.white5 ?? ""}|${r?.powerball ?? ""}`;
      if (!seen.has(k)) {
        seen.add(k);
        all.push(r);
      }
    }

    return all;
  }

  function buildIndexFromRows(rows) {
    const whitesIndex = new Map();
    const compact = [];

    for (let i = 0; i < (rows || []).length; i++) {
      const r = rows[i];
      const pb = toIntOrNull(r?.powerball);
      const w = normalizeWhitesArray([r?.white1, r?.white2, r?.white3, r?.white4, r?.white5]);
      const wSet = new Set(w);

      const dd = String(r?.draw_date ?? "");
      const ts = parseDateValue(dd) ?? 0;

      compact.push({ pb, whites: wSet, draw_date: dd, ts });

      for (const n of wSet) {
        if (!whitesIndex.has(n)) whitesIndex.set(n, []);
        whitesIndex.get(n).push(i);
      }
    }

    return { whitesIndex, compact };
  }

  const historyIndex = useMemo(() => buildIndexFromRows(historyAllRows), [historyAllRows]);
  const futureIndex = useMemo(() => buildIndexFromRows(futureAllRows), [futureAllRows]);

  function computeMatchesForSuggestion(s, indexObj, mode, maxMatches = 10) {
    if (!indexObj?.compact?.length) return [];

    const { whitesIndex, compact } = indexObj;

    const sWhites = normalizeWhitesArray([s?.white1, s?.white2, s?.white3, s?.white4, s?.white5]);
    const sPb = toIntOrNull(s?.powerball);

    const candidateCounts = new Map();

    for (const n of sWhites) {
      const list = whitesIndex.get(n);
      if (!list) continue;
      for (const rowIdx of list) {
        candidateCounts.set(rowIdx, (candidateCounts.get(rowIdx) || 0) + 1);
      }
    }

    const matches = [];
    for (const [rowIdx, whiteMatches] of candidateCounts.entries()) {
      const h = compact[rowIdx];

      const pbMatch = sPb !== null && h?.pb !== null && Number(sPb) === Number(h.pb);
      const totalMatches = whiteMatches + (pbMatch ? 1 : 0);

      if (totalMatches >= 3) {
        const underlineWhites = [];
        for (const n of sWhites) {
          if (h.whites.has(n)) underlineWhites.push(n);
        }
        matches.push({
          id: `${s.id}::${mode}::${rowIdx}`,
          score: totalMatches,
          pbMatched: pbMatch,
          underlineWhites,
          drawDate: h.draw_date,
          ts: h.ts,
        });
      }
    }

    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (mode === "history") return (b.ts || 0) - (a.ts || 0);
      return (a.ts || 0) - (b.ts || 0);
    });

    return matches.slice(0, Math.max(0, maxMatches));
  }

  const activeCompareMode = historicalCompareEnabled
    ? "history"
    : futureCompareEnabled
    ? "future"
    : null;

  const isCompareEnabled = Boolean(activeCompareMode);
  const activeLoading = activeCompareMode === "history" ? historyAllLoading : futureAllLoading;

  const toggleHistoricalComparison = async () => {
    const next = !historicalCompareEnabled;

    if (next) {
      setFutureCompareEnabled(false);
      setHoveredSuggestionId(null);
    }

    setHistoricalCompareEnabled(next);

    if (!next) {
      setHoveredSuggestionId(null);
      return;
    }

    if (next && historyAllRows.length === 0 && !historyAllLoading) {
      setHistoryAllLoading(true);
      try {
        const all = await fetchFullHistoryByYear();
        setHistoryAllRows(all);
      } catch (e) {
        setHistoricalCompareEnabled(false);
      } finally {
        setHistoryAllLoading(false);
      }
    }
  };

  const toggleFutureComparison = async () => {
    const next = !futureCompareEnabled;

    if (next) {
      setHistoricalCompareEnabled(false);
      setHoveredSuggestionId(null);
    }

    setFutureCompareEnabled(next);

    if (!next) {
      setHoveredSuggestionId(null);
      return;
    }

    if (next && futureAllRows.length === 0 && !futureAllLoading) {
      setFutureAllLoading(true);
      try {
        const all = await fetchAllFutureDraws();
        setFutureAllRows(all);
      } catch (e) {
        setFutureCompareEnabled(false);
      } finally {
        setFutureAllLoading(false);
      }
    }
  };

  function onSuggestionHoverEnter(s) {
    if (!isCompareEnabled) return;
    if (!s?.id) return;

    setOverlayFromRef(suggestedBoxRef);

    setHoveredSuggestionId(s.id);

    if (activeCompareMode === "history") {
      setHoveredHistoryMatchesBySuggestionId((prev) => {
        if (prev[s.id]) return prev;
        const computed = computeMatchesForSuggestion(s, historyIndex, "history", 10);
        return { ...prev, [s.id]: computed };
      });
      return;
    }

    if (activeCompareMode === "future") {
      setHoveredFutureMatchesBySuggestionId((prev) => {
        if (prev[s.id]) return prev;
        const computed = computeMatchesForSuggestion(s, futureIndex, "future", 10);
        return { ...prev, [s.id]: computed };
      });
    }
  }

  function onSuggestionHoverLeave(s) {
    if (!isCompareEnabled) return;
    if (!s?.id) return;
    setHoveredSuggestionId((cur) => (cur === s.id ? null : cur));
  }

  const hoveredSuggestion = useMemo(() => {
    if (!hoveredSuggestionId) return null;
    return (suggestions || []).find((x) => x.id === hoveredSuggestionId) || null;
  }, [hoveredSuggestionId, suggestions]);

  const hoveredMatches = useMemo(() => {
    if (!hoveredSuggestionId) return [];
    if (activeCompareMode === "history")
      return hoveredHistoryMatchesBySuggestionId[hoveredSuggestionId] || [];
    if (activeCompareMode === "future")
      return hoveredFutureMatchesBySuggestionId[hoveredSuggestionId] || [];
    return [];
  }, [
    hoveredSuggestionId,
    activeCompareMode,
    hoveredHistoryMatchesBySuggestionId,
    hoveredFutureMatchesBySuggestionId,
  ]);

  const panelTitle = activeCompareMode === "future" ? "Future matches" : "Historical matches";
  const panelLoadingText =
    activeCompareMode === "future" ? "Loading future data..." : "Loading historical data...";
  const panelOrderHint = activeCompareMode === "future" ? "Closest first" : "Most recent first";

  /* =========================
     Designer Sets comparisons
     ========================= */

  const [designerCompareMode, setDesignerCompareMode] = useState(null); // null | "filtered" | "suggested"
  const [hoveredDesignerRow, setHoveredDesignerRow] = useState(null);

  const [designerFilteredMatchesByRowId, setDesignerFilteredMatchesByRowId] = useState({});
  const [designerSuggestedMatchesByRowId, setDesignerSuggestedMatchesByRowId] = useState({});

  function buildIndexFromTargetRows(rows) {
    const whitesIndex = new Map();
    const compact = [];

    const arr = Array.isArray(rows) ? rows : [];
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i];
      const pb = toIntOrNull(r?.powerball);

      const w = normalizeWhitesArray([r?.white1, r?.white2, r?.white3, r?.white4, r?.white5]);
      const wSet = new Set(w);

      const dd = String(r?.draw_date ?? "");
      const ts = parseDateValue(dd) ?? 0;

      compact.push({ pb, whites: wSet, draw_date: dd, ts, orderIdx: i });

      for (const n of wSet) {
        if (!whitesIndex.has(n)) whitesIndex.set(n, []);
        whitesIndex.get(n).push(i);
      }
    }

    return { whitesIndex, compact };
  }

  const filteredIndex = useMemo(() => buildIndexFromTargetRows(filteredItems), [filteredItems]);
  const suggestedIndex = useMemo(() => buildIndexFromTargetRows(suggestions), [suggestions]);

  function computeMatchesForDesignerRow(designerRow, indexObj, mode, maxMatches = 10) {
    if (!indexObj?.compact?.length) return [];

    const hoveredWhites = normalizeWhitesArray([
      designerRow?.b1,
      designerRow?.b2,
      designerRow?.b3,
      designerRow?.b4,
      designerRow?.b5,
    ]);
    const hoveredPb = toIntOrNull(designerRow?.pb);

    if (hoveredWhites.length === 0 && hoveredPb === null) return [];

    const { whitesIndex, compact } = indexObj;
    const candidateCounts = new Map();

    for (const n of hoveredWhites) {
      const list = whitesIndex.get(n);
      if (!list) continue;
      for (const tIdx of list) {
        candidateCounts.set(tIdx, (candidateCounts.get(tIdx) || 0) + 1);
      }
    }

    const matches = [];
    for (const [tIdx, whiteMatches] of candidateCounts.entries()) {
      const t = compact[tIdx];

      const pbMatch = hoveredPb !== null && t?.pb !== null && Number(hoveredPb) === Number(t.pb);
      const totalMatches = whiteMatches + (pbMatch ? 1 : 0);

      if (totalMatches >= 3) {
        const underlineWhites = [];
        for (const n of hoveredWhites) {
          if (t.whites.has(n)) underlineWhites.push(n);
        }

        matches.push({
          id: `${designerRow.id}::${mode}::${tIdx}`,
          score: totalMatches,
          pbMatched: pbMatch,
          underlineWhites,
          drawDate: t.draw_date || "",
          ts: t.ts || 0,
          orderIdx: t.orderIdx || 0,
        });
      }
    }

    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (mode === "filtered") return (b.ts || 0) - (a.ts || 0);
      return (a.orderIdx || 0) - (b.orderIdx || 0);
    });

    return matches.slice(0, Math.max(0, maxMatches));
  }

  function onDesignerCompareModeChange(nextMode) {
    setDesignerCompareMode(nextMode);
    setHoveredDesignerRow(null);
  }

  function onDesignerHoverEnter(row) {
    if (!designerCompareMode) return;
    if (!row?.id) return;

    setOverlayFromRef(designerBoxRef);

    setHoveredDesignerRow(row);

    if (designerCompareMode === "filtered") {
      setDesignerFilteredMatchesByRowId((prev) => {
        if (prev[row.id]) return prev;
        const computed = computeMatchesForDesignerRow(row, filteredIndex, "filtered", 10);
        return { ...prev, [row.id]: computed };
      });
      return;
    }

    if (designerCompareMode === "suggested") {
      setDesignerSuggestedMatchesByRowId((prev) => {
        if (prev[row.id]) return prev;
        const computed = computeMatchesForDesignerRow(row, suggestedIndex, "suggested", 10);
        return { ...prev, [row.id]: computed };
      });
    }
  }

  function onDesignerHoverLeave(row) {
    if (!designerCompareMode) return;
    if (!row?.id) return;
    setHoveredDesignerRow((cur) => (cur?.id === row.id ? null : cur));
  }

  const designerHoveredMatches = useMemo(() => {
    if (!designerCompareMode || !hoveredDesignerRow?.id) return [];
    if (designerCompareMode === "filtered")
      return designerFilteredMatchesByRowId[hoveredDesignerRow.id] || [];
    if (designerCompareMode === "suggested")
      return designerSuggestedMatchesByRowId[hoveredDesignerRow.id] || [];
    return [];
  }, [
    designerCompareMode,
    hoveredDesignerRow,
    designerFilteredMatchesByRowId,
    designerSuggestedMatchesByRowId,
  ]);

  /* =========================
     Shared pills
     ========================= */

  // ✅ Upgrade: sin amarillo, solo grises y rojos
  const whiteHitPill =
    "inline-flex items-center justify-center min-w-[20px] px-1.5 py-[1px] rounded bg-gray-200 text-gray-900 border border-gray-300";
  const pbHitPill =
    "inline-flex items-center justify-center min-w-[20px] px-1.5 py-[1px] rounded bg-red-100 text-red-700 border border-red-300";
  const normalNum =
    "inline-flex items-center justify-center min-w-[20px] px-1.5 py-[1px] rounded bg-transparent";
  const pbNormal =
    "inline-flex items-center justify-center min-w-[20px] px-1.5 py-[1px] rounded bg-transparent text-red-600 font-semibold";

  const showDesignerPanel = Boolean(designerCompareMode && hoveredDesignerRow);
  const showSuggestedPanel = Boolean(isCompareEnabled && hoveredSuggestion && !showDesignerPanel);

  const designerPanelTitle =
    designerCompareMode === "suggested" ? "Suggested matches" : "Filter Results matches";

  // ✅ REF for Table4Modern primary actions
  const designerTableRef = useRef(null);

  // ✅ Standard button style (inactive/active) for Table1Page buttons
  const btnBase =
    "px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors select-none";
  const btnInactive = "bg-white text-gray-900 hover:bg-gray-50";
  const btnActive = "bg-gray-900 text-white border-gray-600 hover:bg-gray-900";
  const btnCls = (isActive) => `${btnBase} ${isActive ? btnActive : btnInactive}`;

  const overlayStyle = overlayPos ? { top: overlayPos.top, left: overlayPos.left } : { top: 80, left: 80 };

  const shouldIgnoreGlobalEnter = (target) => {
    const t = target;
    if (!t || !(t instanceof Element)) return false;

    if (designerBoxRef.current && designerBoxRef.current.contains(t)) return true;

    const tag = t.tagName?.toLowerCase?.() || "";
    if (tag === "textarea") return true;
    if (t.isContentEditable) return true;

    return false;
  };

  const shouldIgnoreGlobalShortcuts = (target) => {
    const t = target;
    if (!t || !(t instanceof Element)) return false;

    if (designerBoxRef.current && designerBoxRef.current.contains(t)) return true;

    const tag = t.tagName?.toLowerCase?.() || "";
    if (tag === "input") return true;
    if (tag === "select") return true;
    if (tag === "textarea") return true;
    if (t.isContentEditable) return true;

    return false;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div
        className="p-4"
        onKeyDownCapture={(e) => {
          if (e.ctrlKey && e.shiftKey && !e.altKey) {
            if (shouldIgnoreGlobalShortcuts(e.target)) return;

            const k = String(e.key || "").toLowerCase();

            if (k === "s") {
              e.preventDefault();
              if (!loading) onSearch();
              return;
            }

            if (k === "c") {
              e.preventDefault();
              clearFilters();
              return;
            }

            if (k === "v") {
              e.preventDefault();
              onExportCSV();
              return;
            }

            if (k === "e") {
              e.preventDefault();
              onExportExcel();
              return;
            }

            if (k === "f") {
              e.preventDefault();
              setSidebarOpen(true);
              setSidebarTab("filter");
              return;
            }

            if (k === "o") {
              e.preventDefault();
              setSidebarOpen(true);
              setSidebarTab("sort");
              return;
            }

            if (k === "n") {
              e.preventDefault();
              designerTableRef.current?.addRow?.();
              return;
            }

            if (k === "w") {
              e.preventDefault();
              designerTableRef.current?.saveSet?.();
              return;
            }

            if (k === "d") {
              e.preventDefault();
              designerTableRef.current?.clearTable?.();
              return;
            }
          }

          if (e.key !== "Enter") return;

          if (shouldIgnoreGlobalEnter(e.target)) return;

          e.preventDefault();
          if (!loading) onSearch();
        }}
      >
        <TopControlsPanel
          scope={scope}
          setScope={setScope}
          operator={operator}
          setOperator={setOperator}
          sort={sort}
          setSort={setSort}
          direction={direction}
          setDirection={setDirection}
          complete={complete}
          setComplete={setComplete}
          limit={limit}
          setLimit={setLimit}
          white1={white1}
          setWhite1={setWhite1}
          white2={white2}
          setWhite2={setWhite2}
          white3={white3}
          setWhite3={setWhite3}
          white4={white4}
          setWhite4={setWhite4}
          white5={white5}
          setWhite5={setWhite5}
          powerball={powerball}
          setPowerball={setPowerball}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          showMonthDay={showMonthDay}
          matchMonthDay={matchMonthDay}
          setMatchMonthDay={setMatchMonthDay}
          monthDayMonth={monthDayMonth}
          setMonthDayMonth={setMonthDayMonth}
          monthDayDay={monthDayDay}
          setMonthDayDay={setMonthDayDay}
          weekdayOnly={weekdayOnly}
          setWeekdayOnly={setWeekdayOnly}
          onSearch={onSearch}
          onClear={clearFilters}
          onPreset={onPreset}
          onExportCSV={onExportCSV}
          onExportExcel={onExportExcel}
          onCalcFrequency={() => {}}
          loading={loading}
          compareEnabled={compareEnabled}
          setCompareEnabled={setCompareEnabled}
          bWhite1={bWhite1}
          setBWhite1={setBWhite1}
          bWhite2={bWhite2}
          setBWhite2={setBWhite2}
          bWhite3={bWhite3}
          setBWhite3={setBWhite3}
          bWhite4={bWhite4}
          setBWhite4={setBWhite4}
          bWhite5={bWhite5}
          setBWhite5={setBWhite5}
          bPowerball={bPowerball}
          setBPowerball={setBPowerball}
        />
      </div>

      <div className="p-4">
        <div className="bg-white border rounded-2xl shadow-sm p-4">
          <div className="mt-2 grid grid-cols-1 lg:grid-cols-[minmax(0,0.70fr)_minmax(0,1.30fr)] gap-4 items-start">
            <div className="border rounded-2xl bg-white p-3 text-[12px]">
              <Table3Modern
                apiCount={count}
                shownCount={shownCount}
                loading={loading}
                err={err}
                rows={filteredItems}
                compareEnabled={compareEnabled}
                hasAnyA={hasAnyA}
                hasAnyB={hasAnyB}
                matchA={matchA}
                matchB={matchB}
              />
            </div>

            <div className="border rounded-2xl bg-white p-3">
              <div>
                <div className="text-sm font-semibold">Designer Sets</div>
                <div className="text-[8px] text-gray-500">
                  Suggested Combinations Update Whenever Filtered Results Change.
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
                <div ref={suggestedBoxRef} className="border rounded-2xl p-3 bg-white relative">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Suggested Combinations</div>
                    <div className="text-xs text-gray-500">{suggestions.length} rows</div>
                  </div>

                  <div className="mt-2 text-[8px] text-gray-500">
                    Based On The Filtered Dataset Frequency (No Predictions).
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className={btnCls(historicalCompareEnabled)}
                      onClick={toggleHistoricalComparison}
                      title="When enabled: hover a combination to view historical matches (matches >= 3 including PB)."
                    >
                      Historical Comparison{historyAllLoading ? "..." : ""}
                    </button>

                    <button
                      type="button"
                      className={btnCls(futureCompareEnabled)}
                      onClick={toggleFutureComparison}
                      title="When enabled: hover a combination to view future matches (matches >= 3 including PB)."
                    >
                      Future Comparison{futureAllLoading ? "..." : ""}
                    </button>
                  </div>

                  <div className="mt-3 border rounded-xl overflow-hidden">
                    <table className="w-full text-[14px]">
                      <thead className="bg-white border-b">
                        <tr className="text-xs text-gray-600">
                          <th className="p-2 text-left">B1</th>
                          <th className="p-2 text-left">B2</th>
                          <th className="p-2 text-left">B3</th>
                          <th className="p-2 text-left">B4</th>
                          <th className="p-2 text-left">B5</th>
                          <th className="p-2 text-left">PB</th>
                        </tr>
                      </thead>

                      <tbody>
                        {suggestions.map((s) => {
                          const isHovered = hoveredSuggestionId === s.id;

                          return (
                            <tr
                              key={s.id}
                              className={`border-b last:border-b-0 hover:bg-gray-50 ${
                                isHovered ? "bg-gray-100" : ""
                              }`}
                              onMouseEnter={() => onSuggestionHoverEnter(s)}
                              onMouseLeave={() => onSuggestionHoverLeave(s)}
                            >
                              <td className="p-2 font-medium">{s.white1}</td>
                              <td className="p-2 font-medium">{s.white2}</td>
                              <td className="p-2 font-medium">{s.white3}</td>
                              <td className="p-2 font-medium">{s.white4}</td>
                              <td className="p-2 font-medium">{s.white5}</td>
                              <td className="p-2 font-semibold text-red-600">{s.powerball}</td>
                            </tr>
                          );
                        })}

                        {suggestions.length === 0 ? (
                          <tr>
                            <td className="p-3 text-gray-500" colSpan={6}>
                              No Suggestions (Requires Filtered Results).
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div ref={designerBoxRef} className="border rounded-2xl p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Designer Sets</div>
                    <div className="text-xs text-gray-500">Target: 150 rows</div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                    <button
                      type="button"
                      className={btnCls(false)}
                      onClick={() => designerTableRef.current?.addRow?.()}
                    >
                      + Row
                    </button>

                    <button
                      type="button"
                      className={btnCls(false)}
                      onClick={() => designerTableRef.current?.saveSet?.()}
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      className={btnCls(false)}
                      onClick={() => designerTableRef.current?.clearTable?.()}
                    >
                      Clear
                    </button>
                  </div>

                  <div className="mt-3">
                    <Table4Modern
                      ref={designerTableRef}
                      defaultSetName={defaultSetName}
                      targetRows={150}
                      filterContext={{
                        matchMode: filterMatchMode,
                        rules: activeFilterRules,
                        lastUrl,
                      }}
                      filteredItems={filteredItems}
                      suggestions={suggestions}
                      compareMode={designerCompareMode}
                      onCompareModeChange={onDesignerCompareModeChange}
                      onRowHoverEnter={onDesignerHoverEnter}
                      onRowHoverLeave={onDesignerHoverLeave}
                      hoveredRowId={hoveredDesignerRow?.id || null}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 — Positional Frequency Analysis (New Panel) */}
      {extension?.section5 ? <Section5PositionalFrequencyPanel section5={extension.section5} /> : null}

      {showDesignerPanel ? (
        <div className="fixed z-[60] w-[360px] max-w-[92vw] pointer-events-none" style={overlayStyle}>
          <div className="bg-gray-400 border border-gray-500 rounded-xl p-2 shadow-xl">
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="px-2.5 py-2 border-b">
                <div className="text-[12px]">
                  <div className="font-semibold text-gray-800">{designerPanelTitle}</div>
                  <div className="text-[11px] text-gray-500">
                    Min 3 (incl. PB) • Top 10 •{" "}
                    {designerCompareMode === "suggested" ? "—" : "Most recent first"} •{" "}
                    {`${designerHoveredMatches.length} shown`}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-[11px] text-gray-900 mb-1">Hovered</div>
                  <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                    <span className={normalNum}>{hoveredDesignerRow.b1 || "—"}</span>
                    <span className={normalNum}>{hoveredDesignerRow.b2 || "—"}</span>
                    <span className={normalNum}>{hoveredDesignerRow.b3 || "—"}</span>
                    <span className={normalNum}>{hoveredDesignerRow.b4 || "—"}</span>
                    <span className={normalNum}>{hoveredDesignerRow.b5 || "—"}</span>
                    <span className={pbNormal}>{hoveredDesignerRow.pb || "—"}</span>
                  </div>
                </div>
              </div>

              <div>
                {designerHoveredMatches.length === 0 ? (
                  <div className="p-2.5 text-[12px] text-gray-500">No matches for this combination.</div>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead className="bg-white border-b">
                      <tr className="text-[11px] text-gray-600">
                        <th className="p-1.5 text-left">B</th>
                        <th className="p-1.5 text-left">PB</th>
                        <th className="p-1.5 text-left">Score</th>
                        <th className="p-1.5 text-left">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {designerHoveredMatches.map((m, idx) => {
                        const d = hoveredDesignerRow;

                        const w1n = toIntOrNull(d.b1);
                        const w2n = toIntOrNull(d.b2);
                        const w3n = toIntOrNull(d.b3);
                        const w4n = toIntOrNull(d.b4);
                        const w5n = toIntOrNull(d.b5);

                        const uw = new Set(m.underlineWhites || []);
                        const pbHit = Boolean(m.pbMatched);
                        const odd = idx % 2 === 1;

                        return (
                          <tr
                            key={m.id}
                            className={`border-b last:border-b-0 ${odd ? "bg-gray-50/60" : "bg-white"}`}
                          >
                            <td className="p-1.5">
                              <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                                <span className={w1n !== null && uw.has(w1n) ? whiteHitPill : normalNum}>
                                  {d.b1 || "—"}
                                </span>
                                <span className={w2n !== null && uw.has(w2n) ? whiteHitPill : normalNum}>
                                  {d.b2 || "—"}
                                </span>
                                <span className={w3n !== null && uw.has(w3n) ? whiteHitPill : normalNum}>
                                  {d.b3 || "—"}
                                </span>
                                <span className={w4n !== null && uw.has(w4n) ? whiteHitPill : normalNum}>
                                  {d.b4 || "—"}
                                </span>
                                <span className={w5n !== null && uw.has(w5n) ? whiteHitPill : normalNum}>
                                  {d.b5 || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="p-1.5">
                              <span className={pbHit ? pbHitPill : pbNormal}>{d.pb || "—"}</span>
                            </td>
                            <td className="p-1.5 text-gray-700">
                              <span className="font-semibold">{m.score}</span>/6
                            </td>
                            <td className="p-1.5 text-gray-600">
                              {designerCompareMode === "filtered" ? m.drawDate || "—" : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-2.5 py-2 border-t text-[11px] text-gray-500">Hover another row to update.</div>
            </div>
          </div>
        </div>
      ) : null}

      {showSuggestedPanel ? (
        <div className="fixed z-[60] w-[360px] max-w-[92vw] pointer-events-none" style={overlayStyle}>
          <div className="bg-gray-400 border border-gray-500 rounded-xl p-2 shadow-xl">
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
              <div className="px-2.5 py-2 border-b">
                <div className="text-[12px]">
                  <div className="font-semibold text-gray-800">{panelTitle}</div>
                  <div className="text-[11px] text-gray-500">
                    Min 3 (incl. PB) • Top 10 • {panelOrderHint} •{" "}
                    {activeLoading ? "Loading..." : `${hoveredMatches.length} shown`}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-[11px] text-gray-900 mb-1">Hovered</div>
                  <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                    <span className={normalNum}>{hoveredSuggestion.white1}</span>
                    <span className={normalNum}>{hoveredSuggestion.white2}</span>
                    <span className={normalNum}>{hoveredSuggestion.white3}</span>
                    <span className={normalNum}>{hoveredSuggestion.white4}</span>
                    <span className={normalNum}>{hoveredSuggestion.white5}</span>
                    <span className={pbNormal}>{hoveredSuggestion.powerball}</span>
                  </div>
                </div>
              </div>

              <div>
                {activeLoading ? (
                  <div className="p-2.5 text-[12px] text-gray-500">{panelLoadingText}</div>
                ) : hoveredMatches.length === 0 ? (
                  <div className="p-2.5 text-[12px] text-gray-500">No matches for this combination.</div>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead className="bg-white border-b">
                      <tr className="text-[11px] text-gray-600">
                        <th className="p-1.5 text-left">B</th>
                        <th className="p-1.5 text-left">PB</th>
                        <th className="p-1.5 text-left">Score</th>
                        <th className="p-1.5 text-left">Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {hoveredMatches.map((m, idx) => {
                        const s = hoveredSuggestion;

                        const w1n = toIntOrNull(s.white1);
                        const w2n = toIntOrNull(s.white2);
                        const w3n = toIntOrNull(s.white3);
                        const w4n = toIntOrNull(s.white4);
                        const w5n = toIntOrNull(s.white5);

                        const uw = new Set(m.underlineWhites || []);
                        const pbHit = Boolean(m.pbMatched);
                        const odd = idx % 2 === 1;

                        return (
                          <tr
                            key={m.id}
                            className={`border-b last:border-b-0 ${odd ? "bg-gray-50/60" : "bg-white"}`}
                          >
                            <td className="p-1.5">
                              <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                                <span className={w1n !== null && uw.has(w1n) ? whiteHitPill : normalNum}>
                                  {s.white1}
                                </span>
                                <span className={w2n !== null && uw.has(w2n) ? whiteHitPill : normalNum}>
                                  {s.white2}
                                </span>
                                <span className={w3n !== null && uw.has(w3n) ? whiteHitPill : normalNum}>
                                  {s.white3}
                                </span>
                                <span className={w4n !== null && uw.has(w4n) ? whiteHitPill : normalNum}>
                                  {s.white4}
                                </span>
                                <span className={w5n !== null && uw.has(w5n) ? whiteHitPill : normalNum}>
                                  {s.white5}
                                </span>
                              </div>
                            </td>
                            <td className="p-1.5">
                              <span className={pbHit ? pbHitPill : pbNormal}>{s.powerball}</span>
                            </td>
                            <td className="p-1.5 text-gray-700">
                              <span className="font-semibold">{m.score}</span>/6
                            </td>
                            <td className="p-1.5 text-gray-600">{m.drawDate || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-2.5 py-2 border-t text-[11px] text-gray-500">Hover another row to update.</div>
            </div>
          </div>
        </div>
      ) : null}

      <RightSidebar
        open={sidebarOpen}
        activeTab={sidebarTab}
        setActiveTab={setSidebarTab}
        onClose={() => setSidebarOpen(false)}
        filterRules={filterRules}
        setFilterRules={setFilterRules}
        filterMatchMode={filterMatchMode}
        setFilterMatchMode={setFilterMatchMode}
        sortRules={sortRules}
        setSortRules={setSortRules}
      />

      <div className="fixed right-0 top-1/2 -translate-y-1/2 w-12 border-l bg-gray-50 flex flex-col items-center py-3 gap-2 shadow-sm z-40">
        <button
          type="button"
          className={`w-10 h-10 rounded border text-xs font-semibold transition-colors ${
            sidebarOpen && sidebarTab === "filter"
              ? "bg-gray-900 text-white border-gray-600"
              : "bg-white text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => {
            setSidebarOpen(true);
            setSidebarTab("filter");
          }}
          title="Filter"
        >
          Filter
        </button>

        <button
          type="button"
          className={`w-10 h-10 rounded border text-xs font-semibold transition-colors ${
            sidebarOpen && sidebarTab === "sort"
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => {
            setSidebarOpen(true);
            setSidebarTab("sort");
          }}
          title="Sort"
        >
          Sort
        </button>
      </div>
    </div>
  );
}
