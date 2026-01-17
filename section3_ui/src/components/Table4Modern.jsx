// src/components/Table4Modern.jsx
import React, { useEffect, useMemo, useRef, useState, useImperativeHandle } from "react";

/**
 * Table4Modern — Designer Sets (Modern Preview)
 * - Compact inputs to fit more rows on screen
 * - Paste TSV/CSV/spaces
 * - Delete/Backspace: clears active cell or deletes selected rows
 * - Clear confirmation
 * - Save set in localStorage (includes filterContext)
 *
 * ✅ This component now:
 * - Renders TWO compare toggles in Designer Sets header:
 *   1) Filter Results Comparison
 *   2) Suggested Comparison
 * - Delegates compare state + hover handlers to parent (Table1.jsx)
 * - Does NOT render any overlay panel (panel lives in Table1.jsx)
 *
 * ✅ NEW:
 * - Enter moves to next ball (B1→...→PB→next row B1)
 * - If next row doesn't exist, create it and focus B1
 * - Enter does not bubble to parent (prevents triggering Table1 search)
 */

const COLS = [
  { key: "b1", label: "B1", min: 1, max: 69, maxLen: 2 },
  { key: "b2", label: "B2", min: 1, max: 69, maxLen: 2 },
  { key: "b3", label: "B3", min: 1, max: 69, maxLen: 2 },
  { key: "b4", label: "B4", min: 1, max: 69, maxLen: 2 },
  { key: "b5", label: "B5", min: 1, max: 69, maxLen: 2 },
  { key: "pb", label: "PB", min: 1, max: 26, maxLen: 2 },
];

const LS_KEY = "pb_sets_v1";
const DEFAULT_FALLBACK_NAME = "Designed combinations (no filters)";

/* =========================
   Small helpers
   ========================= */

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function newRow() {
  return { id: makeId(), b1: "", b2: "", b3: "", b4: "", b5: "", pb: "" };
}

function makeInitialRows(count) {
  const n = Math.max(1, Number(count) || 1);
  return Array.from({ length: n }, () => newRow());
}

function sanitizeNumber(value, min, max) {
  if (value === "" || value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const i = Math.trunc(n);
  // ✅ (tu cambio) mostrar lo que se escribe aunque esté fuera de rango
  if (i < min || i > max) return String(i);
  return String(i);
}

function parsePasted(text) {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  for (const line of lines) {
    const parts = line.includes("\t")
      ? line.split("\t")
      : line.includes(",")
      ? line.split(",")
      : line.split(/\s+/);

    out.push(parts.slice(0, 6).map((x) => x.trim()));
  }
  return out;
}

function saveSetToLocalStorage({ name, createdAt, rows, filterContext }) {
  const payload = { id: makeId(), name, createdAt, rows, filterContext };
  const current = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  current.unshift(payload);
  localStorage.setItem(LS_KEY, JSON.stringify(current));
  return payload;
}

const Table4Modern = React.forwardRef(function Table4Modern(
  {
    defaultSetName,
    filterContext,
    targetRows = 150,

    // datasets are passed but not used here for matching anymore (panel logic lives in parent)
    filteredItems = [],
    suggestions = [],

    // ✅ Parent-controlled compare state + handlers (Table1.jsx)
    compareMode = null, // null | "filtered" | "suggested"
    onCompareModeChange = () => {},
    onRowHoverEnter = () => {},
    onRowHoverLeave = () => {},
    hoveredRowId = null,

    // ✅ NEW: hide duplicated buttons (+ Row / Save / Clear)
    // By default: FALSE to remove the repeated buttons shown in the red box.
    showRowSaveClear = false,
  },
  ref
) {
  const [rows, setRows] = useState(() => makeInitialRows(targetRows));
  const [setName, setSetName] = useState(() => String(defaultSetName || "").trim());
  const [lastSaved, setLastSaved] = useState(null);

  const [activeCell, setActiveCell] = useState({ rowId: null, colKey: null });
  const [selectedRowIds, setSelectedRowIds] = useState(() => new Set());

  const tableRef = useRef(null);

  // ✅ refs para focus por celda: `${rowId}:${colKey}`
  const inputRefs = useRef(new Map());
  const pendingFocusRef = useRef(null); // { rowId, colKey }

  const effectiveDefaultName = useMemo(() => {
    const n = String(defaultSetName || "").trim();
    return n || DEFAULT_FALLBACK_NAME;
  }, [defaultSetName]);

  useEffect(() => {
    setSetName((prev) => (String(prev || "").trim() ? prev : effectiveDefaultName));
  }, [effectiveDefaultName]);

  const isCompareEnabled = Boolean(compareMode);

  const onCellChange = (rowId, colKey, raw) => {
    const col = COLS.find((c) => c.key === colKey);
    if (!col) return;

    const cleaned = String(raw ?? "").replace(/\D/g, "").slice(0, col.maxLen);
    const v = sanitizeNumber(cleaned, col.min, col.max);

    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [colKey]: v } : r)));
  };

  const onAddRow = () => setRows((prev) => [...prev, newRow()]);

  const onClearTable = () => {
    const ok = window.confirm('Are you sure you want to clear "Designer Sets (Modern)"?');
    if (!ok) return;
    setRows(makeInitialRows(targetRows));
    setSelectedRowIds(new Set());
    setActiveCell({ rowId: null, colKey: null });

    // also clear hover state in parent (optional, safe)
    if (compareMode) onCompareModeChange(compareMode); // no-op toggle not desired here
  };

  const onSaveSet = () => {
    const name = String(effectiveDefaultName || "").trim() || DEFAULT_FALLBACK_NAME;

    const cleanRows = rows
      .map((r) => ({ b1: r.b1, b2: r.b2, b3: r.b3, b4: r.b4, b5: r.b5, pb: r.pb }))
      .filter((r) => Object.values(r).some((v) => String(v || "").trim() !== ""));

    const createdAt = new Date().toISOString();
    const saved = saveSetToLocalStorage({ name, createdAt, rows: cleanRows, filterContext });
    setLastSaved(saved);
    window.alert("Set saved to localStorage ✅");
  };

  // ✅ para que Table1 pueda llamar:
  // designerTableRef.current?.addRow()
  // designerTableRef.current?.saveSet()
  // designerTableRef.current?.clearTable()
  useImperativeHandle(
    ref,
    () => ({
      addRow: onAddRow,
      saveSet: onSaveSet,
      clearTable: onClearTable,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, effectiveDefaultName, filterContext, targetRows, compareMode]
  );

  const toggleRow = (rowId, multi) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (!multi) next.clear();
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Delete" && e.key !== "Backspace") return;

    if (selectedRowIds.size > 0) {
      setRows((prev) => prev.filter((r) => !selectedRowIds.has(r.id)));
      setSelectedRowIds(new Set());
      setActiveCell({ rowId: null, colKey: null });
      return;
    }

    if (activeCell.rowId && activeCell.colKey) {
      setRows((prev) =>
        prev.map((r) => (r.id === activeCell.rowId ? { ...r, [activeCell.colKey]: "" } : r))
      );
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;

    const parsed = parsePasted(text);
    if (!parsed.length) return;

    e.preventDefault();

    setRows((prev) => {
      const next = [...prev];

      const startIdx = activeCell.rowId ? next.findIndex((r) => r.id === activeCell.rowId) : -1;
      const insertAt = startIdx >= 0 ? startIdx : next.length;

      while (next.length < insertAt + parsed.length) next.push(newRow());

      for (let i = 0; i < parsed.length; i++) {
        const vals = parsed[i];
        const row = next[insertAt + i];
        const patched = { ...row };

        for (let c = 0; c < COLS.length; c++) {
          const col = COLS[c];
          const cleaned = String(vals[c] ?? "").replace(/\D/g, "").slice(0, col.maxLen);
          patched[col.key] = sanitizeNumber(cleaned, col.min, col.max);
        }

        next[insertAt + i] = patched;
      }

      return next;
    });
  };

  /* =========================
     Compare toggles (delegated to parent)
     ========================= */

  const toggleFilterResultsComparison = () => {
    const next = compareMode === "filtered" ? null : "filtered";
    onCompareModeChange(next);
  };

  const toggleSuggestedComparison = () => {
    const next = compareMode === "suggested" ? null : "suggested";
    onCompareModeChange(next);
  };

  /* =========================
     ✅ Ctrl+Shift shortcuts (component-only)
     ========================= */

  useEffect(() => {
    const onKeyDownGlobal = (e) => {
      if (!e.ctrlKey || !e.shiftKey) return;

      const k = String(e.key || "").toLowerCase();

      // ✅ Shortcuts (no logic changes, just triggers existing handlers)
      if (k === "f") {
        e.preventDefault();
        toggleFilterResultsComparison();
        return;
      }

      if (k === "s") {
        e.preventDefault();
        toggleSuggestedComparison();
        return;
      }

      if (k === "r") {
        e.preventDefault();
        if (showRowSaveClear) onAddRow();
        return;
      }

      if (k === "a") {
        e.preventDefault();
        if (showRowSaveClear) onSaveSet();
        return;
      }

      if (k === "l") {
        e.preventDefault();
        if (showRowSaveClear) onClearTable();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDownGlobal, true);
    return () => window.removeEventListener("keydown", onKeyDownGlobal, true);
  }, [compareMode, showRowSaveClear, rows, effectiveDefaultName, filterContext]); // keep in sync with existing handlers

  /* =========================
     ✅ Enter navigation helpers
     ========================= */

  const focusCell = (rowId, colKey) => {
    const el = inputRefs.current.get(`${rowId}:${colKey}`);
    if (el && typeof el.focus === "function") {
      el.focus();
      return true;
    }
    return false;
  };

  const moveFocusNext = (rowId, colKey) => {
    const rowIdx = rows.findIndex((x) => x.id === rowId);
    if (rowIdx < 0) return;

    const colIdx = COLS.findIndex((c) => c.key === colKey);
    if (colIdx < 0) return;

    // next col in same row
    if (colIdx < COLS.length - 1) {
      const nextColKey = COLS[colIdx + 1].key;
      setActiveCell({ rowId, colKey: nextColKey });

      if (!focusCell(rowId, nextColKey)) {
        pendingFocusRef.current = { rowId, colKey: nextColKey };
      }
      return;
    }

    // PB -> next row B1
    const nextRowIdx = rowIdx + 1;

    if (nextRowIdx < rows.length) {
      const nextRowId = rows[nextRowIdx].id;
      const nextColKey = COLS[0].key;

      setActiveCell({ rowId: nextRowId, colKey: nextColKey });
      if (!focusCell(nextRowId, nextColKey)) {
        pendingFocusRef.current = { rowId: nextRowId, colKey: nextColKey };
      }
      return;
    }

    // if no next row: create one and focus it
    const created = newRow();
    pendingFocusRef.current = { rowId: created.id, colKey: COLS[0].key };
    setRows((prev) => [...prev, created]);
    setActiveCell({ rowId: created.id, colKey: COLS[0].key });
  };

  useEffect(() => {
    const p = pendingFocusRef.current;
    if (!p) return;
    if (focusCell(p.rowId, p.colKey)) pendingFocusRef.current = null;
  }, [rows]);

  const handleInputKeyDownCapture = (e, rowId, colKey) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    e.stopPropagation(); // ✅ important: prevent Table1 from catching Enter
    moveFocusNext(rowId, colKey);
  };

  // ✅ Inputs base (same size/feel)
  const cellInputBase =
    "w-8 h-8 rounded-full text-[12px] font-bold text-center border border-black " +
    "focus:outline-none focus:ring-2 focus:ring-black/20";

  const whiteBallBase = `${cellInputBase} text-black`;
  const pbInputBase =
    `${cellInputBase} bg-red-600 text-white ` +
    "ring-2 ring-red-400 shadow-[0_0_10px_rgba(255,0,0,0.55)]";

  return (
    <div className="h-full bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col text-[12px] leading-tight">
      {/* Compact action bar */}
      <div className="p-2 border-b bg-white flex items-center justify-end gap-2">
        {/* ✅ Compare toggles */}
        <button
          type="button"
          className={`px-2 py-1 border rounded-lg text-[12px] font-semibold bg-white hover:bg-gray-50 ${
            compareMode === "filtered"
              ? "ring-2 ring-black/10 bg-gray-900 text-white border-gray-900 hover:bg-gray-900"
              : ""
          }`}
          onClick={toggleFilterResultsComparison}
          title="Ctrl+Shift+F"
        >
          <span className="underline">F</span>ilter Results Comparison
        </button>

        <button
          type="button"
          className={`px-2 py-1 border rounded-lg text-[12px] font-semibold bg-white hover:bg-gray-50 ${
            compareMode === "suggested"
              ? "ring-2 ring-black/10 bg-gray-900 text-white border-gray-900 hover:bg-gray-900"
              : ""
          }`}
          onClick={toggleSuggestedComparison}
          title="Ctrl+Shift+S"
        >
          <span className="underline">S</span>uggested Comparison
        </button>

        {showRowSaveClear && (
          <>
            <button
              type="button"
              className="px-2 py-1 border rounded-lg text-[12px] font-semibold hover:bg-gray-50 bg-white"
              onClick={onAddRow}
              title="Ctrl+Shift+R"
            >
              + <span className="underline">R</span>ow
            </button>

            <button
              type="button"
              className="px-2 py-1 border rounded-lg text-[12px] font-semibold hover:bg-gray-50 bg-white"
              onClick={onSaveSet}
              title="Ctrl+Shift+A"
            >
              S<span className="underline">a</span>ve
            </button>

            <button
              type="button"
              className="px-2 py-1 border rounded-lg text-[12px] font-semibold hover:bg-gray-50 bg-white"
              onClick={onClearTable}
              title="Ctrl+Shift+L"
            >
              C<span className="underline">l</span>ear
            </button>
          </>
        )}
      </div>

      <div
        className="flex-1 overflow-auto"
        tabIndex={0}
        ref={tableRef}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
      >
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-white/95 backdrop-blur border-b">
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-2 py-2 font-semibold text-gray-700 whitespace-nowrap"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, idx) => {
              const rowSelected = selectedRowIds.has(r.id);
              const odd = idx % 2 === 1;

              // ✅ Parent controlled hovered row id (only relevant when compare enabled)
              const isHovered = isCompareEnabled && hoveredRowId === r.id;

              const rowBg = rowSelected
                ? "bg-red-50"
                : isHovered
                ? "bg-gray-100"
                : odd
                ? "bg-gray-50/60"
                : "bg-white";

              return (
                <tr
                  key={r.id}
                  className={`border-b ${rowBg} hover:bg-gray-200`}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) toggleRow(r.id, true);
                  }}
                  onMouseEnter={() => {
                    if (!compareMode) return;
                    onRowHoverEnter(r);
                  }}
                  onMouseLeave={() => {
                    if (!compareMode) return;
                    onRowHoverLeave(r);
                  }}
                >
                  {COLS.map((c) => {
                    const isActive = activeCell.rowId === r.id && activeCell.colKey === c.key;
                    const isPB = c.key === "pb";

                    const whiteBallBg = isHovered ? "bg-transparent" : "bg-white";
                    const pbExtraRing = isHovered ? "ring-2 ring-black/10" : "";

                    const refKey = `${r.id}:${c.key}`;

                    return (
                      <td key={c.key} className="px-2 py-2">
                        <input
                          ref={(el) => {
                            if (!el) {
                              inputRefs.current.delete(refKey);
                              return;
                            }
                            inputRefs.current.set(refKey, el);
                          }}
                          className={`${
                            isPB
                              ? `${pbInputBase} ${pbExtraRing}`
                              : `${whiteBallBase} ${whiteBallBg}`
                          } ${isActive ? "ring-2 ring-black/30" : ""}`}
                          value={r[c.key]}
                          inputMode="numeric"
                          maxLength={c.maxLen}
                          pattern="\\d*"
                          onKeyDownCapture={(e) => handleInputKeyDownCapture(e, r.id, c.key)}
                          onFocus={() => {
                            setActiveCell({ rowId: r.id, colKey: c.key });
                            setSelectedRowIds(new Set());
                          }}
                          onChange={(e) => onCellChange(r.id, c.key, e.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="p-3 text-[11px] text-gray-500">
          Paste: TSV/CSV/spaces (example: <span className="font-semibold">1 2 3 4 5 6</span>).
          <br />
          Delete/Backspace clears <span className="font-semibold">cell</span> · selected rows delete combos.
          <br />
          <span className="font-semibold">Enter</span> moves to next ball (PB → next row).
        </div>
      </div>
    </div>
  );
});

export default Table4Modern;
