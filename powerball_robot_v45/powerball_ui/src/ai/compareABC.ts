type StratId = "continuity" | "diversity" | "overdue";

export type StrategyRun = {
  id: StratId;
  label: string;
  assistants: string[];
  result: any;
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
      total += overlapCount(suggestions[i].whites, suggestions[j].whites);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : 0;
}

export function summarizeStrategy(run: StrategyRun, preferredWindow = 10) {
  const r = run.result;
  if (!r || r.status !== "ok") {
    return {
      id: run.id,
      label: run.label,
      ok: false,
      message: r?.message || "error",
    };
  }
  const byWindow = r.analysis?.by_window || {};
  const wObj = byWindow[String(preferredWindow)] || byWindow["20"] || byWindow["10"] || byWindow["5"];
  const avgOverlap = wObj?.continuity?.avg_overlap ?? 0;

  // flatten suggestions from assistants used in this run
  const by = r.results_by_assistant || {};
  let all: any[] = [];
  for (const aid of Object.keys(by)) {
    all = all.concat(by[aid]?.suggestions || []);
  }

  const count = all.length;
  const diversity = avgPairwiseOverlap(all); // lower is better
  const antiOverlap = r.meta?.anti_overlap || null;

  return {
    id: run.id,
    label: run.label,
    ok: true,
    count,
    continuity_avg_overlap: avgOverlap,
    internal_avg_overlap: diversity,
    anti_overlap: antiOverlap,
  };
}

export function pickWinner(summaries: any[]) {
  const ok = summaries.filter((s) => s.ok);
  if (!ok.length) return null;

  // Heuristic:
  // - continuity winner: highest continuity_avg_overlap
  // - diversity winner: lowest internal_avg_overlap (more diverse)
  // - overdue winner: not measured directly; use count + continuity mid; so choose max count among overdue run
  const cont = ok.reduce((a, b) => (b.continuity_avg_overlap > a.continuity_avg_overlap ? b : a), ok[0]);
  const div = ok.reduce((a, b) => (b.internal_avg_overlap < a.internal_avg_overlap ? b : a), ok[0]);

  return { continuity: cont, diversity: div };
}


export function pickOverallWinner(summaries: any[]) {
  const ok = summaries.filter((s: any) => s.ok);
  if (!ok.length) return null;

  // Balanced score: reward continuity a bit, reward diversity (low internal overlap), reward having enough count
  const score = (s: any) => {
    const cont = Number(s.continuity_avg_overlap ?? 0);
    const divPenalty = Number(s.internal_avg_overlap ?? 0);
    const cnt = Number(s.count ?? 0);
    return cont * 1.0 - divPenalty * 0.7 + Math.min(1, cnt / 30) * 0.6;
  };

  return ok.reduce((a: any, b: any) => (score(b) > score(a) ? b : a), ok[0]);
}
