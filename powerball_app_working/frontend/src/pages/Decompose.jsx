// src/pages/Decompose.jsx
import { useMemo } from "react";
import useHistoryData, { useDecompose } from "../hooks/useHistoryData";
import DecomposePanel from "../components/DecomposePanel";

// Real context
import { useFilterResults } from "../context/FilterResultsContext";

export default function DecomposePage() {
  // 1) Preferred dataset: Filters (Table1)
  // ✅ Hook always called directly (Rules of Hooks OK)
  const filterCtx = useFilterResults();
  const filteredRows = filterCtx?.filteredRows || [];
  const filteredCount = filteredRows.length;

  // 2) Fallback: Full History if no filters
  const shouldUseHistory = filteredCount === 0;

  // ✅ Hook ALWAYS called. The fetch is decided by your hook internally.
  const { value: history, loading, error } = useHistoryData(
    shouldUseHistory
      ? {
          complete: 1,
          sort: "draw_date",
          direction: "asc",
          output: "json",
          limit: 8000,
        }
      : {}
  );

  const dataset = useMemo(() => {
    return shouldUseHistory ? history || [] : filteredRows || [];
  }, [shouldUseHistory, history, filteredRows]);

  const decompose = useDecompose(dataset);

  return (
    <div className="py-6">
      <div className="app-card p-6">
        {/* Intentionally minimal header (copy removed as requested) */}
        {error ? (
          <div className="mb-4 text-sm text-red-600">Error loading history: {String(error)}</div>
        ) : null}

        {/* Keep loading state silent; DecomposePanel can render empty state if needed */}
        {shouldUseHistory && loading ? null : null}

        <div>
          <DecomposePanel decompose={decompose} defaultBase={12} />
        </div>
      </div>
    </div>
  );
}
