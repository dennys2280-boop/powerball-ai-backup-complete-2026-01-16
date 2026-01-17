import React, { useMemo, useState } from "react";

type Suggestion = any;

export default function CompareReasons() {
  const [a, setA] = useState("sequence_hunter");
  const [b, setB] = useState("diversity_optimizer");
  const data = (window as any).__latestAIAssistantsJson;

  const pair = useMemo(() => {
    const by = data?.results_by_assistant || {};
    const sa: Suggestion | undefined = by?.[a]?.suggestions?.[0];
    const sb: Suggestion | undefined = by?.[b]?.suggestions?.[0];
    return { sa, sb };
  }, [data, a, b]);

  return (
    <div style={{ padding: 16, background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h2>Compare Reasons (V36)</h2>
      <p style={{ opacity: 0.85 }}>Compara why[] / rationale_tags / signals_used de dos asistentes (lee directo del JSON).</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label>Asistente A <input value={a} onChange={(e) => setA(e.target.value)} style={input()} /></label>
        <label>Asistente B <input value={b} onChange={(e) => setB(e.target.value)} style={input()} /></label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <Card title={a} s={pair.sa} />
        <Card title={b} s={pair.sb} />
      </div>

      {!data ? (
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          No hay JSON cargado. Ejecuta primero y asegúrate de guardar el resultado en <code>window.__latestAIAssistantsJson</code>.
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, s }: { title: string; s?: any }) {
  return (
    <div style={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {s ? (
        <>
          <div style={{ fontFamily: "monospace" }}>{(s.whites || []).join("-")} | PB {s.powerball}</div>
          <h4>why[]</h4>
          <ul>{(s.why || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          <h4>rationale_tags</h4>
          <div>{(s.rationale_tags || []).join(", ") || "(none)"}</div>
          <h4>signals_used</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(s.signals_used || {}, null, 2)}</pre>
        </>
      ) : (
        <div style={{ opacity: 0.8 }}>No suggestion[0] para este asistente.</div>
      )}
    </div>
  );
}

function input() {
  return { width: 260, padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#111827", color: "#e2e8f0" } as any;
}
