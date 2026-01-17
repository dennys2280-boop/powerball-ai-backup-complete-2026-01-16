// powerball_ui/src/pages/Dashboard.jsx
import Card from "../components/Card";
import { LoadingState, ErrorState } from "../components/States";
import SectionLayout from "../layouts/SectionLayout";
import useDashboardData from "../hooks/useDashboardData";

export default function Dashboard() {
  const { status, data, run } = useDashboardData();

  if (status === "idle" || status === "loading") {
    return <LoadingState title="Loading Dashboard…" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        title="Dashboard unavailable"
        message="There was a problem loading this view."
        action={
          <button className="app-btn-primary" onClick={run}>
            Try again
          </button>
        }
      />
    );
  }

  // ✅ Safe defaults to avoid runtime crashes (data can be undefined / partial)
  const safe = data ?? {};
  const kpis = Array.isArray(safe.kpis) ? safe.kpis : [];
  const main = safe.main ?? { title: "Main panel", message: "No data yet." };
  const side = safe.side ?? { title: "Side panel", message: "No data yet." };

  return (
    <SectionLayout
      title="Dashboard"
      subtitle="Layout + stub data (ready to connect real API)."
      actions={
        <button className="app-btn-ghost" onClick={run}>
          Refresh
        </button>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {kpis.map((k, idx) => (
          <Card
            key={k?.id ?? `kpi-${idx}`}
            title={k?.label ?? "KPI"}
            subtitle={String(k?.value ?? "—")}
          >
            <p className="text-slate-700">KPI placeholder.</p>
          </Card>
        ))}
      </div>

      {/* Main/Side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 min-h-[320px]" title="Main panel" subtitle={main.title}>
          <p className="text-slate-700">{main.message}</p>
        </Card>

        <Card className="min-h-[320px]" title="Side panel" subtitle={side.title}>
          <p className="text-slate-700">{side.message}</p>
        </Card>
      </div>
    </SectionLayout>
  );
}
