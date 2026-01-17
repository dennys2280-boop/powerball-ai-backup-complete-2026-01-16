export type GoalHint = { preset?: string; tweaks?: any; notes: string[] };

export function parseGoals(text: string): GoalHint {
  const t = (text || "").toLowerCase();
  const notes: string[] = [];
  const out: GoalHint = { notes };

  if (t.includes("divers") || t.includes("muy diferente")) {
    out.preset = "diversidad_maxima";
    notes.push("Preferencia: diversidad.");
  }
  if (t.includes("secuen") || t.includes("continu")) {
    out.preset = out.preset ? out.preset : "continuidad";
    notes.push("Preferencia: continuidad/secuencias.");
  }
  if (t.includes("overdue") || t.includes("ausent") || t.includes("frio")) {
    out.preset = out.preset ? out.preset : "overdue_controlado";
    notes.push("Preferencia: overdue/ausentes.");
  }

  // simple numeric
  const m = t.match(/(\d+)\s*(jugadas|plays)/);
  if (m) {
    out.tweaks = { ...(out.tweaks || {}), n_suggestions: parseInt(m[1]) };
    notes.push(`Cantidad solicitada: ${m[1]}`);
  }
  return out;
}
