// src/hooks/useHistoryData.js
import { useMemo } from "react";
import useAsync from "./useAsync";
import { fetchHistoryRows } from "../lib/api";
import { buildDecomposeCorrelation } from "../lib/decomposeCorrelation";

/**
 * SECTION 4 — DECOMPOSE
 * Hook para construir correlaciones izquierda / derecha
 * a partir del histórico de sorteos (read-only).
 *
 * Contract-safe:
 * - No predicción
 * - No Powerball (se calcula sólo con white1..white5)
 * - Combinaciones ordenadas (lo decide buildDecomposeCorrelation)
 */
export function useDecompose(draws) {
  return useMemo(() => buildDecomposeCorrelation(draws || []), [draws]);
}

/**
 * Hook principal de histórico
 * Fuente única de datos (Section 1–4)
 *
 * ✅ Acepta params opcionales:
 * useHistoryData() -> default
 * useHistoryData({ limit: 8000, direction: "asc" }) -> custom
 */
export default function useHistoryData(params = {}) {
  // ✅ Key estable por contenido (no por referencia)
  const key = useMemo(() => JSON.stringify(params || {}), [JSON.stringify(params || {})]);

  // ✅ Params estables: solo cambian cuando cambia el key
  const stableParams = useMemo(() => params || {}, [key]);

  // useAsync(fn, deps, { immediate })
  return useAsync(() => fetchHistoryRows(stableParams), [key], { immediate: true });
}
