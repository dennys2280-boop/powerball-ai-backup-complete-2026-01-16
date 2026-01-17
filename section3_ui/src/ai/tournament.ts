type AssistantScore = {
  assistant: string;
  count: number;
  avgScore: number;
  internalOverlap: number; // lower better
  notes: string[];
};

function overlapCount(a: number[], b: number[]) {
  const s = new Set(a);
  let k = 0;
  for (const x of b) if (s.has(x)) k += 1;
  return k;
}

function avgPairwiseOverlap(suggestions: any[]): number {
  if (!suggestions || suggestions.length < 2) return 0;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < suggestions.length; i++) {
    for (let j = i + 1; j < suggestions.length; j++) {
      total += overlapCount(suggestions[i].whites || [], suggestions[j].whites || []);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : 0;
}

export function rankAssistants(result: any): AssistantScore[] {
  const by = result?.results_by_assistant || {};
  const rows: AssistantScore[] = [];

  for (const aid of Object.keys(by)) {
    const sug = by[aid]?.suggestions || [];
    const count = sug.length;
    const avgScore =
      count > 0 ? sug.reduce((a: number, s: any) => a + Number(s.score ?? 0), 0) / count : 0;
    const internalOverlap = avgPairwiseOverlap(sug);
    const notes: string[] = [];
    if (internalOverlap <= 1.2) notes.push("alta diversidad interna");
    if (internalOverlap >= 2.2) notes.push("tendencia a repetir blancas");
    if (avgScore >= 7.5) notes.push("score promedio alto");
    rows.push({ assistant: aid, count, avgScore, internalOverlap, notes });
  }

  // Composite: favor diversity + avg score + count
  const composite = (r: AssistantScore) => r.avgScore * 1.0 - r.internalOverlap * 1.0 + Math.min(1, r.count / 10) * 0.5;
  return rows.sort((a, b) => composite(b) - composite(a));
}

export function narrateTournament(result: any) {
  const ranked = rankAssistants(result);
  if (!ranked.length) return { lines: ["No hay datos para torneo. Ejecuta primero."], ranked: [] };

  const top = ranked[0];
  const lines: string[] = [];
  lines.push("Modo torneo activado. Ranking de asistentes:");
  ranked.slice(0, 5).forEach((r, i) => {
    lines.push(
      `${i + 1}. ${r.assistant}: ${r.count} jugadas, score promedio ${r.avgScore.toFixed(2)}, overlap interno ${r.internalOverlap.toFixed(2)}.`
    );
  });
  if (top.notes.length) {
    lines.push(`Ganador: ${top.assistant} por ${top.notes.slice(0, 2).join(" y ")}.`);
  } else {
    lines.push(`Ganador: ${top.assistant}.`);
  }
  return { lines, ranked };
}
