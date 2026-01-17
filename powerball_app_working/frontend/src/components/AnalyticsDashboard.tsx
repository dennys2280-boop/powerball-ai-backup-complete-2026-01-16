import React, { useMemo } from "react";

type Props = {
  result: any;
  highlight?: "heatmap" | "gaps" | "positions" | "continuity" | null;
  onSelectHighlight?: (h: Props["highlight"]) => void;
};

function asArrayPairs(obj: any): Array<[number, number]> {
  if (!obj) return [];
  return Object.entries(obj)
    .map(([k, v]) => [parseInt(k, 10), Number(v)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
}

function topNFromPairs(pairs: Array<[number, number]>, n = 10) {
  return [...pairs].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function sparkBars(pairs: Array<[number, number]>, maxBars = 30) {
  const slice = pairs.slice(0, maxBars);
  const maxV = Math.max(1, ...slice.map((p) => p[1]));
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 46 }}>
      {slice.map(([k, v]) => (
        <div
          key={k}
          title={`${k}: ${v}`}
          style={{
            width: 6,
            height: Math.max(2, Math.round((v / maxV) * 46)),
            background: "rgba(148,163,184,0.7)",
            borderRadius: 3,
          }}
        />
      ))}
    </div>
  );
}

function Heatmap({ counts }: { counts: Record<string, number> }) {
  const cells = useMemo(() => {
    const pairs = asArrayPairs(counts);
    const maxV = Math.max(1, ...pairs.map((p) => p[1]));
    const rows: any[] = [];
    for (let r = 0; r < 7; r++) {
      const row: any[] = [];
      for (let c = 0; c < 10; c++) {
        const n = r * 10 + c + 1;
        if (n > 69) continue;
        const v = counts?.[String(n)] ?? 0;
        const a = v / maxV;
        row.push({ n, v, a });
      }
      rows.push(row);
    }
    return rows;
  }, [counts]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
      {cells.flat().map((cell: any) => (
        <div
          key={cell.n}
          title={`${cell.n}: ${cell.v}`}
          style={{
            padding: "6px 0",
            textAlign: "center",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: `rgba(14,165,233,${0.08 + cell.a * 0.55})`,
            fontSize: 12,
          }}
        >
          {cell.n}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ result, highlight, onSelectHighlight }: Props) {
  const byWindow = result?.analysis?.by_window || {};
  const w10 = byWindow["10"] || byWindow["20"] || byWindow["5"] || null;

  const countsWhites = w10?.frequency?.counts_whites || {};
  const countsPB = w10?.frequency?.counts_powerball || {};
  const gaps = w10?.gaps || {};
  const cont = w10?.continuity || {};
  const pos = w10?.positional || {};

  const topW = topNFromPairs(asArrayPairs(countsWhites), 10);
  const topPB = topNFromPairs(asArrayPairs(countsPB), 8);

  const overdueW = (gaps?.most_overdue_whites || []).slice(0, 10);
  const missingW = (w10?.frequency?.missing_whites || []).slice(0, 20);

  const active = (h: any) => (highlight === h ? { outline: "2px solid rgba(56,189,248,0.9)" } : {});

  return (
    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Card title="Heatmap blancas (ventana 10)" onClick={() => onSelectHighlight?.("heatmap")} style={active("heatmap")}>
        <Heatmap counts={countsWhites} />
      </Card>

      <Card title="Continuidad + Frecuencia (spark)" onClick={() => onSelectHighlight?.("continuity")} style={active("continuity")}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
          Avg overlap: <b>{cont?.avg_overlap ?? 0}</b> | Max overlap: <b>{cont?.max_overlap ?? 0}</b>
        </div>
        {sparkBars(topW.map((x) => [x[0], x[1]]), 30)}
        <div style={{ marginTop: 10, fontSize: 12 }}>Top blancas: {topW.slice(0, 8).map((x) => x[0]).join(", ")}.</div>
        <div style={{ marginTop: 6, fontSize: 12 }}>Top PB: {topPB.slice(0, 6).map((x) => x[0]).join(", ")}.</div>
      </Card>

      <Card title="Gaps / Overdue" onClick={() => onSelectHighlight?.("gaps")} style={active("gaps")}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>Más atrasados (top 10):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {overdueW.map((x: any) => (
            <Pill key={x[0]} text={`${x[0]} (gap ${x[1]})`} />
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>Ausentes (hasta 20):</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {missingW.map((n: any) => (
            <Pill key={n} text={String(n)} />
          ))}
        </div>
      </Card>

      <Card title="Posiciones (slots)" onClick={() => onSelectHighlight?.("positions")} style={active("positions")}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>Top por posición (primeros 3):</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["white1", "white2", "white3", "white4", "white5"].map((k) => (
            <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{k}</div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                {(pos?.top_by_position?.[k] || []).slice(0, 3).map((p: any) => p[0]).join(", ") || "—"}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, onClick, style }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#0b1220",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 12,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(148,163,184,0.15)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {text}
    </span>
  );
}
