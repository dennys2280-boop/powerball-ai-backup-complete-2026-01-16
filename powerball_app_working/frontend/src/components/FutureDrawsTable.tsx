import React from "react";

export type FutureDrawItem = {
  id?: string;
  draw_date?: string;
  white1?: number | string;
  white2?: number | string;
  white3?: number | string;
  white4?: number | string;
  white5?: number | string;
  powerball?: number | string;
};

export type FutureDrawsTableProps = {
  title?: string;
  subtitle?: string;

  loading?: boolean;
  error?: string | null;

  items?: FutureDrawItem[];

  // Placeholder hooks de UI (no implementan nada aquí):
  onRefresh?: () => void;
};

export default function FutureDrawsTable({
  title = "Future Draws (Pro)",
  subtitle = "Tabla Pro (placeholder). No mezcla con histórico oficial.",
  loading = false,
  error = null,
  items = [],
  onRefresh,
}: FutureDrawsTableProps) {
  return (
    <div className="border rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          </div>

          {onRefresh ? (
            <button type="button" className="app-btn-ghost" onClick={onRefresh}>
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="border rounded-xl p-3 text-sm bg-red-50">
            <span className="font-semibold">Error:</span> {error}
          </div>
        ) : loading ? (
          <div className="text-sm text-gray-500">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">No hay future draws todavía. (Placeholder)</div>
        ) : (
          <div className="text-sm text-gray-700">
            Items listos para renderizar: <span className="font-semibold">{items.length}</span>{" "}
            (Placeholder)
          </div>
        )}
      </div>
    </div>
  );
}
