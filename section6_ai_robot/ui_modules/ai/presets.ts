export type PresetId = "diversidad_maxima" | "continuidad" | "overdue_controlado" | "calendario_pro" | "balanceado";

export function applyPreset(form: any, id: PresetId) {
  switch (id) {
    case "diversidad_maxima":
      return { ...form, assistant_ids: ["diversity_optimizer"], strict_mode: false, similarity_level: 0 };
    case "continuidad":
      return { ...form, assistant_ids: ["sequence_hunter"], strict_mode: true, similarity_level: 2 };
    case "overdue_controlado":
      return { ...form, assistant_ids: ["hot_cold_statistician"], strict_mode: true, similarity_level: 2 };
    case "calendario_pro":
      return { ...form, calendar_pro: true, windows: Array.from(new Set([2, 5, 10, 15, 20, 50])) };
    default:
      return { ...form, assistant_ids: ["sequence_hunter", "diversity_optimizer"], strict_mode: true, similarity_level: 2 };
  }
}
