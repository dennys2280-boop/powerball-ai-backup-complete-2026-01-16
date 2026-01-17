import React, { useMemo, useState } from "react";
import { track } from "../ai/telemetryClient";

export default function StrategyMixer({ form, setForm }: any) {
  const [continuidad, setC] = useState(50);
  const [overdue, setO] = useState(50);
  const [diversidad, setD] = useState(50);
  const [calendario, setK] = useState(0);

  const assistants = useMemo(() => {
    const ids: string[] = [];
    if (continuidad >= 35) ids.push("sequence_hunter");
    if (overdue >= 35) ids.push("hot_cold_statistician");
    if (diversidad >= 35) ids.push("diversity_optimizer");
    if (calendario >= 35) ids.push("calendar_analyst");
    return ids.length ? ids : ["sequence_hunter", "diversity_optimizer"];
  }, [continuidad, overdue, diversidad, calendario]);

  function apply() {
    setForm({ ...form, assistant_ids: assistants, calendar_pro: calendario >= 35 });
    track("strategy_mixer_apply", { continuidad, overdue, diversidad, calendario, assistants });
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h2>Strategy Mixer (V37)</h2>
      <p style={{ opacity: 0.85 }}>Sliders que mezclan estrategias y aplican asistentes/flags al formulario.</p>

      <Slider label="Continuidad" v={continuidad} setV={setC} />
      <Slider label="Overdue" v={overdue} setV={setO} />
      <Slider label="Diversidad" v={diversidad} setV={setD} />
      <Slider label="Calendario" v={calendario} setV={setK} />

      <div style={{ marginTop: 12 }}>
        <b>Asistentes resultantes:</b> {assistants.join(", ")}
      </div>

      <button onClick={apply} style={btn()}>Aplicar al formulario</button>
    </div>
  );
}

function Slider({ label, v, setV }: any) {
  return (
    <div style={{ marginTop: 12 }}>
      <div>{label}: <b>{v}</b></div>
      <input type="range" min={0} max={100} value={v} onChange={(e) => setV(parseInt(e.target.value))} style={{ width: 520 }} />
    </div>
  );
}

function btn() {
  return { marginTop: 14, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#1f2937", color: "white", cursor: "pointer" } as any;
}
