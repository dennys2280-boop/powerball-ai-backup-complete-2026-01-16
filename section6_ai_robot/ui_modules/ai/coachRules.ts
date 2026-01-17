export type CoachRecommendation = {
  id: string;
  title: string;
  say: string[];
  patchForm: (form: any) => any;
};

function getWin(result: any, w = 10) {
  const by = result?.analysis?.by_window || {};
  return by[String(w)] || by["10"] || by["20"] || by["5"] || null;
}

export function generateRecommendations(result: any): CoachRecommendation[] {
  const recs: CoachRecommendation[] = [];
  const w10 = getWin(result, 10);

  const cont = w10?.continuity?.avg_overlap ?? 0;
  const missing = w10?.frequency?.missing_whites?.length ?? 0;
  const overdue = w10?.gaps?.most_overdue_whites?.length ?? 0;
  const anti = result?.meta?.anti_overlap || {};

  if (cont >= 1.2) {
    recs.push({
      id: "weight_sequences",
      title: "Pesar más continuidad",
      say: [
        `Continuidad en ventana 10 está alta (${cont}).`,
        "¿Quieres que priorice Sequence Hunter (solo secuencias) para hoy?",
        "Di: 'sí' para aplicar, o 'no'.",
      ],
      patchForm: (form) => ({ ...form, assistant_ids: ["sequence_hunter"] }),
    });
  }

  if (missing >= 15 && overdue >= 8) {
    recs.push({
      id: "more_overdue",
      title: "Subir overdue",
      say: [
        `Hay muchos ausentes en ventana 10 (${missing}).`,
        "¿Quieres que pese más overdue (Hot/Cold) y suba nivel anti-similares a 2?",
        "Di: 'sí' para aplicar, o 'no'.",
      ],
      patchForm: (form) => ({
        ...form,
        assistant_ids: ["hot_cold_statistician"],
        similarity_level: Math.max(2, form.similarity_level ?? 1),
        strict_mode: true,
      }),
    });
  }

  if (anti?.enabled && (anti?.level ?? 1) >= 2) {
    recs.push({
      id: "relax_level",
      title: "Relajar anti-similares",
      say: [
        `Tienes anti-similares nivel ${anti.level}.`,
        "Si te faltan jugadas, puedo bajar a nivel 1 para generar más diversidad.",
        "Di: 'sí' para aplicar, o 'no'.",
      ],
      patchForm: (form) => ({ ...form, similarity_level: 1, strict_mode: true }),
    });
  }

  return recs;
}
