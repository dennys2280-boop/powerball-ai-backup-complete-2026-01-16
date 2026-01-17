export function buildCSVFromResult(result: any): string {
  const rows: string[][] = [];
  rows.push(["assistant", "whites", "powerball", "score", "rationale_tags", "why", "signals_used"]);

  const by = result?.results_by_assistant || {};
  for (const aid of Object.keys(by)) {
    const sug = by[aid]?.suggestions || [];
    for (const s of sug) {
      rows.push([
        aid,
        (s.whites || []).join("-"),
        String(s.powerball ?? ""),
        String(s.score ?? ""),
        Array.isArray(s.rationale_tags) ? s.rationale_tags.join("|") : "",
        Array.isArray(s.why) ? s.why.join(" ") : "",
        s.signals_used ? JSON.stringify(s.signals_used) : "",
      ]);
    }
  }

  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(escape).join(",")).join("\n");
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function openPrintableReport(result: any) {
  const win = window.open("", "_blank");
  if (!win) return;

  const pre = (obj: any) =>
    `<pre style="white-space:pre-wrap;background:#0b1220;color:#e2e8f0;padding:12px;border-radius:12px;">${escapeHtml(
      JSON.stringify(obj, null, 2)
    )}</pre>`;

  const title = `Powerball AI Report - ${new Date().toISOString().slice(0, 10)}`;
  win.document.write(`
  <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8" />
      <style>
        body{font-family: ui-sans-serif, system-ui; padding: 18px; background:#0f172a; color:#e2e8f0;}
        h1,h2{margin:0 0 12px 0}
        .card{background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px;margin-top:12px}
        button{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:#1f2937;color:#fff;cursor:pointer}
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="card">
        <button onclick="window.print()">Imprimir / Guardar como PDF</button>
        <p style="opacity:.85">Tip: en el diálogo de impresión elige “Guardar como PDF”.</p>
      </div>
      <div class="card">
        <h2>Resumen</h2>
        ${pre({ meta: result?.meta, constraints: result?.constraints, last_draw_used: result?.last_draw_used })}
      </div>
      <div class="card">
        <h2>Resultados (JSON)</h2>
        ${pre(result)}
      </div>
    </body>
  </html>
  `);
  win.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c] as string));
}
