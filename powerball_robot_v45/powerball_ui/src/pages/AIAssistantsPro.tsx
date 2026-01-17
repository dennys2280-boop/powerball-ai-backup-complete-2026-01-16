import React, { useMemo, useState } from "react";
import { applyPreset } from "../ai/presets";
import { track } from "../ai/telemetryClient";
import PowerballRobotCoach from "../components/PowerballRobotCoach";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

function SuggestionList({ result, onExplain }: { result: any; onExplain: (n: number, aid?: string) => void }) {
  const by = result?.results_by_assistant || {};
  const ids = Object.keys(by);

  return (
    <div style={{ marginTop: 12 }}>
      <h3>Jugadas (click para explicar)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ids.map((aid) => {
          const sug = by[aid]?.suggestions || [];
          return (
            <div key={aid} style={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{aid}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {sug.slice(0, 10).map((s: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => onExplain(idx + 1, aid)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12,
                      background: "rgba(148,163,184,0.10)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      cursor: "pointer",
                    }}
                    title="Click para que el robot explique esta jugada"
                  >
                    <div style={{ fontWeight: 700 }}>
                      {idx + 1}. {s.whites.join("-")} | PB {s.powerball}
                    </div>
                    {Array.isArray(s.why) && s.why.length ? (
                      <div style={{ marginTop: 4, fontSize: 12, opacity: 0.85 }}>{s.why.slice(0, 1).join(" ")}</div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AIAssistantsPro() {
  const [form, setForm] = useState({
    windows: [2, 5, 10, 15, 20],
    assistant_ids: ["sequence_hunter", "diversity_optimizer"],
    n_suggestions: 10,
    seed: null as number | null,
    strict_mode: true,
    recent_lookback: 50,
    overlap_block: 4,
    similarity_level: 2,
    constraints: null as any,
  });

  const [latest, setLatest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState<"heatmap" | "gaps" | "positions" | "continuity" | null>(null);
  const [hint, setHint] = useState<string>("");

  async function run() {
    setLoading(true);
    const res = await fetch("http://localhost:8000/api/ai/assistants/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    (window as any).__latestAIAssistantsJson = json;
    setLatest(json);
    setLoading(false);
  }

  const metaLine = useMemo(() => {
    if (!latest?.meta) return "";
    const a = latest.meta.anti_overlap;
    return a ? `Anti-overlap: ${a.enabled ? "ON" : "OFF"} (nivel ${a.level ?? 1}, lookback ${a.recent_lookback}, thr ${a.overlap_block})` : "";
  }, [latest]);

  return (
    <div style={{ padding: 16, color: "#e2e8f0", background: "#0f172a", minHeight: "100vh" }}>
      <h2>AI Assistants Pro (V8+V9)</h2>
      <p style={{ opacity: 0.85 }}>Dashboard visual + explicación por click + export + perfil. {metaLine}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>Preset:</span>
          {([
            ['diversidad_maxima','Diversidad'],
            ['continuidad','Secuencias'],
            ['overdue_controlado','Overdue'],
            ['calendario_pro','Calendario'],
            ['balanceado','Balanceado'],
          ] as any).map(([id,label]: any) => (
            <button key={id} onClick={() => { setForm(applyPreset(form, id)); track('preset_click',{id}); }}
              style={{ padding: 10, borderRadius: 12, background: '#1f2937', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={run} disabled={loading} style={{ padding: 10, borderRadius: 12, background: "#1f2937", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
          {loading ? "Running..." : "Run"}
        </button>
        <button onClick={() => setHighlight("heatmap")} style={{ padding: 10, borderRadius: 12, background: "#1f2937", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
          Heatmap
        </button>
        <button onClick={() => setHighlight("gaps")} style={{ padding: 10, borderRadius: 12, background: "#1f2937", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
          Gaps
        </button>
        <button onClick={() => setHighlight("positions")} style={{ padding: 10, borderRadius: 12, background: "#1f2937", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
          Posiciones
        </button>
        <button onClick={() => setHighlight("continuity")} style={{ padding: 10, borderRadius: 12, background: "#1f2937", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
          Continuidad
        </button>
      </div>

      {latest && latest.status === "ok" ? (
        <>
          <AnalyticsDashboard result={latest} highlight={highlight} onSelectHighlight={setHighlight} />
          <SuggestionList
            result={latest}
            onExplain={(n, aid) => {
              setHint(`Ahora di: "explica jugada ${n}${aid ? " de " + aid : ""}" (o usa el micrófono).`);
            }}
          />
        </>
      ) : latest ? (
        <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#eee", padding: 12, borderRadius: 8, marginTop: 12 }}>{JSON.stringify(latest, null, 2)}</pre>
      ) : null}

      {hint ? (
        <div style={{ marginTop: 12, background: "#111827", borderRadius: 14, padding: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontWeight: 800 }}>Hint</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            <b>{hint}</b>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 12, background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Atajos</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>
          Voz: “modo torneo”, “recomiéndame ajustes”, “guarda este pack”, “mis packs”, “marca jugada 3”, “mis favoritos”, “exporta pack”, “english mode”.
        </div>
      </div>

      <PowerballRobotCoach form={form as any} setForm={setForm as any} onRun={run} latestResultJson={latest} onDashboardHighlight={(h: any) => setHighlight(h)} />
    </div>
  );
}
