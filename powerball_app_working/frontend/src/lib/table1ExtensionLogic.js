// src/lib/table1ExtensionLogic.js
import { useMemo } from "react";
import { useFilterResults } from "../context/FilterResultsContext.jsx";
import { computeSection5Tables } from "./section5PositionalFrequency.js";

/**
 * useTable1Extension (SESSION 5)
 * ✅ Regla: Todo lo nuevo de Tabla 1 vive aquí.
 *
 * Este hook NO asume estructura interna de Table1.
 * Solo calcula "extension" a partir de props/rows y lo devuelve.
 */
export function useTable1Extension(props = {}) {
  // Contract: SECTION 5 is derived from Table 1 filtered results.
  const { filteredRows, meta } = useFilterResults();

  // Keep existing prop-based behavior intact (if any caller passes rows)
  const rows = props?.rows || filteredRows || [];

  const extension = useMemo(() => {
    const section5 = {
      source: "table1",
      updatedAt: meta?.updatedAt || null,
      count: Array.isArray(filteredRows) ? filteredRows.length : 0,
      tables: computeSection5Tables(filteredRows),
    };

    return {
      session: 5,
      enabled: true,

      // placeholders seguros (no rompen nada)
      stats: {
        rows: Array.isArray(rows) ? rows.length : 0,
      },

      // SECTION 5 — Positional Frequency Analysis
      section5,

      // aquí irán tus nuevas piezas:
      // correlations: ...
      // ranking: ...
      // flags: ...
    };
  }, [rows, filteredRows, meta]);

  return extension;
}
