export type LeagueIntent =
  | { type: "set_windows"; windows: number[] }
  | { type: "set_count"; n: number }
  | { type: "set_seed"; seed: number }
  | { type: "set_assistants"; assistant_ids: string[] }
  | { type: "run" }
  | { type: "explain" }
  | { type: "help" }
  | { type: "unknown"; text: string };

const ASSISTANT_KEYWORDS: Array<[string[], string]> = [
  [["secuencia", "continuidad", "markov", "transicion", "transición"], "sequence_hunter"],
  [["posicion", "posición", "posicional", "slots"], "positional_tactician"],
  [["fecha", "calendario", "mm-dd", "weekday", "dia de la semana", "día de la semana"], "date_historian"],
  [["probabilidad", "montecarlo", "monte carlo", "purista"], "probability_purist"],
  [["diversidad", "diverso", "variedad"], "diversity_optimizer"],
  [["hot", "cold", "calientes", "frios", "fríos", "overdue", "atrasados"], "hot_cold_statistician"],
];

export function parseLeagueIntent(text: string): LeagueIntent {
  const t = text.toLowerCase().trim();

  // ✅ BONUS voice shortcuts (automatic form modifications)
  if (t.includes("más diversidad") || t.includes("mas diversidad")) {
    return { type: "set_assistants", assistant_ids: ["diversity_optimizer"] };
  }
  if (t.includes("más overdue") || t.includes("mas overdue") || t.includes("más atrasados") || t.includes("mas atrasados")) {
    return { type: "set_assistants", assistant_ids: ["hot_cold_statistician"] };
  }
  if (t.includes("solo secuencias") || t.includes("solo secuencia") || t.includes("solo continuidad")) {
    return { type: "set_assistants", assistant_ids: ["sequence_hunter"] };
  }

  if (t.includes("ayuda") || t.includes("help") || t.includes("como uso") || t.includes("cómo uso")) return { type: "help" };
  if (t.includes("explica") || t.includes("resumen") || t.includes("qué encontraste") || t.includes("que encontraste"))
    return { type: "explain" };
  if (t.includes("ejecuta") || t.includes("run") || t.includes("generar") || t.includes("corre") || t.includes("correr"))
    return { type: "run" };

  const winMatch = t.match(/(ventanas|windows)\s+([0-9,\s]+)/);
  if (winMatch) {
    const nums = winMatch[2]
      .split(/[\s,]+/)
      .map((x) => parseInt(x, 10))
      .filter((n) => [2, 5, 10, 15, 20].includes(n));
    if (nums.length) return { type: "set_windows", windows: Array.from(new Set(nums)) };
  }

  const countMatch = t.match(/([0-9]{1,2})\s+(jugadas|sugerencias|combinaciones)/);
  if (countMatch) {
    const n = Math.max(1, Math.min(50, parseInt(countMatch[1], 10)));
    return { type: "set_count", n };
  }

  const seedMatch = t.match(/seed\s+([0-9]{1,9})/);
  if (seedMatch) return { type: "set_seed", seed: parseInt(seedMatch[1], 10) };

  if (t.includes("todos")) {
    return {
      type: "set_assistants",
      assistant_ids: [
        "hot_cold_statistician",
        "sequence_hunter",
        "positional_tactician",
        "date_historian",
        "probability_purist",
        "diversity_optimizer",
      ],
    };
  }

  const picks = new Set<string>();
  for (const [keys, id] of ASSISTANT_KEYWORDS) {
    if (keys.some((k) => t.includes(k))) picks.add(id);
  }
  if (picks.size) return { type: "set_assistants", assistant_ids: Array.from(picks) };

  return { type: "unknown", text };
}
