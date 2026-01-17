import React, { useState } from "react";

export default function BacktestSandbox() {
  const [start, setStart] = useState("2024-01-01");
  const [end, setEnd] = useState("2024-12-31");
  const [assistants, setAssistants] = useState("sequence_hunter,diversity_optimizer,hot_cold_statistician");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function run() {
    setLoading(true);
    const res = await fetch("http://localhost:8000/api/backtest/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_date: start,
        end_date: end,
        windows: [10, 20],
        assistant_ids: assistants.split(",").map((s) => s.trim()).filter(Boolean),
        n_suggestions: 15,
        limit_dates: 30,
        strict_mode: true,
        similarity_level: 2,
      }),
    });
    setOut(await res.json());
    setLoading(false);
  }

  return (
    <div style={{ padding: 16, background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h2>Backtesting Sandbox (V24)</h2>
      <p style={{ opacity: 0.85 }}>Evaluación comparativa (NO predicción).</p>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <label>Start date<input value={start} onChange={(e) => setStart(e.target.value)} style={input()} /></label>
        <label>End date<input value={end} onChange={(e) => setEnd(e.target.value)} style={input()} /></label>
        <label>Assistants<input value={assistants} onChange={(e) => setAssistants(e.target.value)} style={input()} /></label>
        <button onClick={run} disabled={loading} style={btn()}>{loading ? "Running..." : "Run backtest"}</button>
      </div>
      {out ? <pre style={{ whiteSpace: "pre-wrap", background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12, marginTop: 12 }}>{JSON.stringify(out, null, 2)}</pre> : null}
    </div>
  );
}

function input() { return { width: "100%", padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#111827", color: "#e2e8f0" } as any; }
function btn() { return { padding: 10, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "#1f2937", color: "white", cursor: "pointer" } as any; }
