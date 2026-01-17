// src/context/FilterResultsContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const FilterResultsContext = createContext(null);

const STORAGE_KEY = "filterResultsContext:v1";

function safeParseJSON(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function sanitizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function sanitizeMeta(m) {
  const source = typeof m?.source === "string" ? m.source : "table1";
  const updatedAt = typeof m?.updatedAt === "string" ? m.updatedAt : null;
  const count = Number.isFinite(Number(m?.count)) ? Number(m.count) : 0;
  return { source, updatedAt, count };
}

export function FilterResultsProvider({ children }) {
  // ✅ hydrate once
  const initial = useMemo(() => {
    const raw = globalThis?.localStorage?.getItem?.(STORAGE_KEY);
    const parsed = safeParseJSON(raw);

    if (!parsed) {
      return {
        filteredRows: [],
        meta: { source: "table1", updatedAt: null, count: 0 },
      };
    }

    return {
      filteredRows: sanitizeRows(parsed.filteredRows),
      meta: sanitizeMeta(parsed.meta),
    };
  }, []);

  const [filteredRows, _setFilteredRows] = useState(initial.filteredRows);
  const [meta, _setMeta] = useState(initial.meta);

  /**
   * ✅ Stable setter + guard against "clear on navigation"
   * Only allow setting empty [] when options.force === true
   * (Clear button uses force)
   */
  const setFilteredRows = useCallback((rows, options) => {
    const arr = sanitizeRows(rows);

    // block accidental clears
    if (arr.length === 0 && !options?.force) return;

    _setFilteredRows(arr);
  }, []);

  /**
   * ✅ Stable setter + guard against meta reset
   * Only allow count=0 overwrite when options.force === true
   */
  const setMeta = useCallback((next, options) => {
    const m = sanitizeMeta(next);

    // block accidental meta reset to "empty"
    if ((m.count ?? 0) === 0 && !options?.force) return;

    _setMeta(m);
  }, []);

  // ✅ persist on change
  useEffect(() => {
    try {
      globalThis?.localStorage?.setItem?.(
        STORAGE_KEY,
        JSON.stringify({
          filteredRows: sanitizeRows(filteredRows),
          meta: sanitizeMeta(meta),
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [filteredRows, meta]);

  const value = useMemo(
    () => ({
      filteredRows,
      setFilteredRows,
      meta,
      setMeta,
    }),
    [filteredRows, setFilteredRows, meta, setMeta]
  );

  return <FilterResultsContext.Provider value={value}>{children}</FilterResultsContext.Provider>;
}

export function useFilterResults() {
  const ctx = useContext(FilterResultsContext);
  if (!ctx) throw new Error("useFilterResults must be used inside <FilterResultsProvider />");
  return ctx;
}
