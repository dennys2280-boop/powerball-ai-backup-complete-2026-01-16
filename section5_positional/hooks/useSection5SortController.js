// src/hooks/useSection5SortController.js
import { useCallback, useMemo, useState } from "react";

/**
 * Sorting controller for SECTION 5.
 *
 * IMPORTANT CONTRACT:
 * - Sorting MUST NOT reorder the 1..69 table rows.
 * - Sorting only affects a secondary "Ranked View" (Top/Bottom) and highlights.
 */

const POS_KEYS = ["pos1", "pos2", "pos3", "pos4", "pos5", "pos6"];

export function useSection5SortController() {
  // Global sort (optional): { column: 'count', dir: 'asc'|'desc' }
  const [globalSort, setGlobalSort] = useState(null);

  // Per-table sort overrides: { [posKey]: { column, dir } }
  const [tableSorts, setTableSorts] = useState({});

  // Custom mapping: array of { posKey, column, dir }
  const [customRules, setCustomRules] = useState([]);

  const resetAll = useCallback(() => {
    setGlobalSort(null);
    setTableSorts({});
    setCustomRules([]);
  }, []);

  const setTableSort = useCallback((posKey, next) => {
    setTableSorts((prev) => ({
      ...prev,
      [posKey]: { column: next?.column || "count", dir: next?.dir || "desc" },
    }));
  }, []);

  const applyToAllTables = useCallback((next) => {
    const payload = { column: next?.column || "count", dir: next?.dir || "desc" };
    setGlobalSort(payload);
  }, []);

  const applyToSelected = useCallback((rules) => {
    const next = Array.isArray(rules) ? rules : [];
    setCustomRules(next.filter((r) => POS_KEYS.includes(r?.posKey)));
  }, []);

  const resolveSortForTable = useCallback(
    (posKey) => {
      // Priority: custom rule (first match) > per-table > global > null
      const custom = (customRules || []).find((r) => r?.posKey === posKey);
      if (custom) return { column: custom.column || "count", dir: custom.dir || "desc" };

      const per = tableSorts?.[posKey];
      if (per) return { column: per.column || "count", dir: per.dir || "desc" };

      if (globalSort) return { column: globalSort.column || "count", dir: globalSort.dir || "desc" };

      return null;
    },
    [customRules, tableSorts, globalSort]
  );

  const api = useMemo(
    () => ({
      globalSort,
      tableSorts,
      customRules,
      actions: {
        resetAll,
        setTableSort,
        applyToAllTables,
        applyToSelected,
        setCustomRules, // direct editor
        setGlobalSort,
      },
      resolveSortForTable,
    }),
    [globalSort, tableSorts, customRules, resetAll, setTableSort, applyToAllTables, applyToSelected, resolveSortForTable]
  );

  return api;
}

export function buildRankedView(rows, sort, limit = 10) {
  const arr = Array.isArray(rows) ? rows : [];
  const s = sort || { column: "count", dir: "desc" };

  if (s.column === "count") {
    const ordered = [...arr].sort((a, b) => {
      const av = Number(a?.count || 0);
      const bv = Number(b?.count || 0);
      return s.dir === "asc" ? av - bv : bv - av;
    });
    return ordered.slice(0, Math.max(0, Number(limit) || 10));
  }

  // Default fallback: count
  const ordered = [...arr].sort((a, b) => {
    const av = Number(a?.count || 0);
    const bv = Number(b?.count || 0);
    return s.dir === "asc" ? av - bv : bv - av;
  });
  return ordered.slice(0, Math.max(0, Number(limit) || 10));
}
