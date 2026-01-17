import React from "react";
import FutureDrawsTable, { FutureDrawItem } from "../components/FutureDrawsTable";

export default function FutureDrawsPage() {
  // Placeholder Pro: la data se conectará desde el hook/API cuando toque.
  const loading = false;
  const error: string | null = null;
  const items: FutureDrawItem[] = [];

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Future Draws</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestión de combinaciones futuras (Pro). No es histórico oficial.
        </p>
      </div>

      <FutureDrawsTable loading={loading} error={error} items={items} />
    </div>
  );
}
