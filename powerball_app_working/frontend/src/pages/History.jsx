// src/pages/History.jsx
import Card from "../components/Card";
import { LoadingState, EmptyState, ErrorState } from "../components/States";
import SectionLayout from "../layouts/SectionLayout";
import useHistoryData from "../hooks/useHistoryData";

export default function History() {
  const { status, data: rows, run } = useHistoryData();

  if (status === "idle" || status === "loading") {
    return <LoadingState title="Cargando Dashboard…" />;
  }

  if (status === "error")
    return (
      <ErrorState
        title="No se pudo cargar History"
        message="Intenta de nuevo."
        action={
          <button className="app-btn-primary" onClick={run}>
            Reintentar
          </button>
        }
      />
    );

  if (!rows || rows.length === 0)
    return (
      <EmptyState
        title="Sin historial"
        message="Aún no hay registros guardados."
        action={<button className="app-btn-primary">Crear primer registro</button>}
      />
    );

  return (
    <SectionLayout
      title="History"
      subtitle="Tabla base responsive + datos stub."
      actions={
        <button className="app-btn-ghost" onClick={run}>
          Refrescar
        </button>
      }
    >
      <Card title="Historial" subtitle="Registros recientes">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 pr-6 font-medium">Fecha</th>
                <th className="py-3 pr-6 font-medium">Draws</th>
                <th className="py-3 pr-6 font-medium">Nota</th>
                <th className="py-3 pr-0 font-medium">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr key={r.id} className="text-slate-700">
                  <td className="py-3 pr-6 whitespace-nowrap">{r.date}</td>
                  <td className="py-3 pr-6">{r.draws}</td>
                  <td className="py-3 pr-6">{r.note}</td>
                  <td className="py-3 pr-0">
                    <button className="app-btn-ghost">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">Mostrando {rows.length} filas (stub)</div>
          <div className="flex gap-2">
            <button className="app-btn-ghost">Anterior</button>
            <button className="app-btn-ghost">Siguiente</button>
          </div>
        </div>
      </Card>
    </SectionLayout>
  );
}
