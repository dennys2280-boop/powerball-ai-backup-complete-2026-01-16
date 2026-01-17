export function buildMentorPack(result: any) {
  if (!result || result.status !== "ok") return null;
  const by = result.results_by_assistant || {};
  const pick = (id: string, n: number) => (by[id]?.suggestions || []).slice(0, n);

  const pack = [
    { title: "Continuidad (Sequence Hunter)", assistant: "sequence_hunter", suggestions: pick("sequence_hunter", 3) },
    { title: "Overdue controlado (Hot/Cold)", assistant: "hot_cold_statistician", suggestions: pick("hot_cold_statistician", 3) },
    { title: "Diversidad máxima (Diversity)", assistant: "diversity_optimizer", suggestions: pick("diversity_optimizer", 3) },
  ];

  const anyId = Object.keys(by)[0];
  if (anyId && (!pack[0].suggestions.length && !pack[1].suggestions.length && !pack[2].suggestions.length)) {
    pack.push({ title: `Sugerencias (${anyId})`, assistant: anyId, suggestions: (by[anyId]?.suggestions || []).slice(0, 9) });
  }

  return pack;
}
