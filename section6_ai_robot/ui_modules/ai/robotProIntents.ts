export type RobotIntent =
  | { type: "wizard_start" }
  | { type: "wizard_cancel" }
  | { type: "wizard_confirm" }
  | { type: "wizard_reject" }
  | { type: "set_goal"; goal: "continuity" | "diversity" | "overdue" | "mixed" }
  | { type: "set_windows"; windows: number[] }
  | { type: "set_count"; n: number }
  | { type: "set_seed"; seed: number }
  | { type: "set_assistants"; assistant_ids: string[] }
  | { type: "run" }
  | { type: "explain" }
  | { type: "playground_start" }
  | { type: "mentor_pack" }
  | { type: "set_strict"; enabled: boolean; overlap_block?: number }
  | { type: "set_risk"; profile: "conservador" | "balanceado" | "agresivo" }
  | { type: "explain_play"; n: number; assistant_id?: string }
  | { type: "autopilot" }
  | { type: "compare_strategies" }
  | { type: "set_similarity_level"; level: 0 | 1 | 2 | 3 }
  | { type: "set_constraints"; constraints: any }
  | { type: "export_pack" }
  | { type: "save_profile" }
  | { type: "load_profile" }
  | { type: "show_dashboard"; view: "heatmap" | "gaps" | "positions" | "continuity" }
  | { type: "tournament" }
  | { type: "calendar_pro" }
  | { type: "autopilot_pro" }
  | { type: "coach_recommend" }
  | { type: "coach_yes" }
  | { type: "coach_no" }
  | { type: "save_pack" }
  | { type: "list_packs" }
  | { type: "favorite_add"; n: number; assistant_id?: string }
  | { type: "favorite_list" }
  | { type: "favorite_remove"; n: number; assistant_id?: string }
  | { type: "set_lang"; lang: "es" | "en" }
  | { type: "slow_reading"; enabled: boolean }
  | { type: "toggle_auditor"; enabled: boolean }
  | { type: "share_pack" }
  | { type: "compare_reasons_open" }
  | { type: "gen_and_optimize"; n: number; k: number }
  | { type: "block_near_duplicates"; enabled: boolean }
  | { type: "conservative_mode" }
  | { type: "aggressive_mode" }
  | { type: "demo_pitch" }
  | { type: "load_suggestion"; assistant_id?: string; index?: number }
  | { type: "replace_number"; from: number; to: number }
  | { type: "set_powerball"; pb: number }
  | { type: "rescore" }
  | { type: "help" }
  | { type: "unknown"; text: string };

export function parseRobotIntent(text: string): RobotIntent {
  const t = text.toLowerCase().trim();

  // Wizard controls
  if (t.includes("modo entrevista") || t.includes("modo wizard") || t === "entrevista") return { type: "wizard_start" };
  if (t.includes("cancelar") || t.includes("salir") || t.includes("stop wizard")) return { type: "wizard_cancel" };
  if (t === "sí" || t === "si" || t.includes("confirmo") || t.includes("confirmar")) return { type: "wizard_confirm" };
  if (t.includes("no") || t.includes("rechazo")) return { type: "wizard_reject" };

  // Goals
  if (t.includes("continuidad") || t.includes("secuencias") || t.includes("secuencia")) return { type: "set_goal", goal: "continuity" };
  if (t.includes("diversidad") || t.includes("variado") || t.includes("variedad")) return { type: "set_goal", goal: "diversity" };
  if (t.includes("overdue") || t.includes("atrasados") || t.includes("fríos") || t.includes("frios")) return { type: "set_goal", goal: "overdue" };
  if (t.includes("mixto") || t.includes("mezcla") || t.includes("todos")) return { type: "set_goal", goal: "mixed" };

  // Existing shortcuts
  if (t.includes("más diversidad") || t.includes("mas diversidad")) return { type: "set_assistants", assistant_ids: ["diversity_optimizer"] };
  if (t.includes("más overdue") || t.includes("mas overdue") || t.includes("más atrasados") || t.includes("mas atrasados"))
    return { type: "set_assistants", assistant_ids: ["hot_cold_statistician"] };
  if (t.includes("solo secuencias") || t.includes("solo secuencia") || t.includes("solo continuidad"))
    return { type: "set_assistants", assistant_ids: ["sequence_hunter"] };

  // Form filling
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

  // Commands
  if (t.includes("ayuda") || t.includes("help") || t.includes("como uso") || t.includes("cómo uso")) return { type: "help" };
  if (t.includes("explica") || t.includes("resumen")) return { type: "explain" };
  if (t.includes("ejecuta") || t.includes("run") || t.includes("generar") || t.includes("corre")) return { type: "run" };

  // Playground
  if (t.includes("modo playground") || t.includes("editar jugada") || t.includes("modo edición")) return { type: "playground_start" };

  const loadMatch = t.match(/(carga|cargar|usa|usar)\s+(la\s+)?(jugada|sugerencia)\s+([0-9]{1,2})(\s+de\s+([a-z_]+))?/);
  if (loadMatch) {
    const idx = parseInt(loadMatch[4], 10) - 1;
    const aid = loadMatch[6];
    return { type: "load_suggestion", index: idx, assistant_id: aid };
  }

  const repl = t.match(/cambia\s+([0-9]{1,2})\s+por\s+([0-9]{1,2})/);
  if (repl) return { type: "replace_number", from: parseInt(repl[1], 10), to: parseInt(repl[2], 10) };

  const pbMatch = t.match(/(powerball|pb)\s*(a|=)?\s*([0-9]{1,2})/);
  if (pbMatch) return { type: "set_powerball", pb: parseInt(pbMatch[3], 10) };

  if (t.includes("rescore") || t.includes("re score") || t.includes("re-score") || t.includes("evalúa") || t.includes("evaluar")) {
    return { type: "rescore" };
  }


  // Tournament / calendar / coach / packs / i18n
  if (t.includes("modo torneo") || t.includes("torneo")) return { type: "tournament" };
  if (t.includes("modo calendario pro") || t.includes("calendario pro") || t.includes("semana del año") || t.includes("semana del ano")) return { type: "calendar_pro" };
  if (t.includes("autopilot pro") || t.includes("piloto automático pro") || t.includes("piloto automatico pro")) return { type: "autopilot_pro" };
  if (t.includes("recomiéndame ajustes") || t.includes("recomiendame ajustes") || t.includes("recomendaciones")) return { type: "coach_recommend" };
  if (t === "sí" || t === "si" || t.includes("sí aplica") || t.includes("si aplica")) return { type: "coach_yes" };
  if (t.includes("no") && (t.length <= 5 || t.includes("no gracias"))) return { type: "coach_no" };

  if (t.includes("guarda este pack") || t.includes("guardar pack")) return { type: "save_pack" };
  if (t.includes("mis packs") || t.includes("lista packs") || t.includes("ver packs")) return { type: "list_packs" };

  const favAdd = t.match(/marca\s+(la\s+)?jugada\s+([0-9]{1,2})(\s+de\s+([a-z_]+))?/);
  if (favAdd) return { type: "favorite_add", n: parseInt(favAdd[2], 10), assistant_id: favAdd[4] };

  const favRm = t.match(/quita\s+(la\s+)?jugada\s+([0-9]{1,2})(\s+de\s+([a-z_]+))?/);
  if (favRm) return { type: "favorite_remove", n: parseInt(favRm[2], 10), assistant_id: favRm[4] };

  if (t.includes("mis favoritos") || t.includes("favoritos")) return { type: "favorite_list" };

  if (t.includes("english mode") || t.includes("modo inglés") || t.includes("modo ingles") || t === "english") return { type: "set_lang", lang: "en" };
  if (t.includes("modo español") || t.includes("modo espanol") || t === "español" || t === "espanol") return { type: "set_lang", lang: "es" };

  if (t.includes("modo lectura lenta") || t.includes("lectura lenta")) return { type: "slow_reading", enabled: true };
  if (t.includes("lectura normal") || t.includes("modo lectura normal")) return { type: "slow_reading", enabled: false };

  // Dashboard views
  if (t.includes("muéstrame el heatmap") || t.includes("muestrame el heatmap") || t.includes("heatmap")) return { type: "show_dashboard", view: "heatmap" };
  if (t.includes("explica gaps") || t.includes("gaps") || t.includes("overdue gráfico") || t.includes("overdue grafico")) return { type: "show_dashboard", view: "gaps" };
  if (t.includes("posiciones") || t.includes("slots") || t.includes("posición") || t.includes("posicion")) return { type: "show_dashboard", view: "positions" };
  if (t.includes("continuidad gráfico") || t.includes("continuidad grafico") || t.includes("continuidad")) return { type: "show_dashboard", view: "continuity" };

  // Export / profile
  if (t.includes("exporta") || t.includes("exportar") || t.includes("exporta pack") || t.includes("exportar pack")) return { type: "export_pack" };
  if (t.includes("guarda mi configuración") || t.includes("guarda mi configuracion") || t.includes("guardar configuración") || t.includes("guardar configuracion")) return { type: "save_profile" };
  if (t.includes("carga mi configuración") || t.includes("carga mi configuracion") || t.includes("cargar configuración") || t.includes("cargar configuracion")) return { type: "load_profile" };

  // Mentor pack
  if (t.includes("pack inteligente") || t.includes("modo mentor") || t.includes("pack")) return { type: "mentor_pack" };


  // Anti-similares levels
  const lvl = t.match(/anti\s*similares\s*nivel\s*([0-3])/);
  if (lvl) return { type: "set_similarity_level", level: parseInt(lvl[1], 10) as 0 | 1 | 2 | 3 };

  // Constraints: range "solo 10 a 60"
  const range = t.match(/solo\s+([0-9]{1,2})\s*(a|hasta)\s*([0-9]{1,2})/);
  if (range) {
    const a = parseInt(range[1], 10);
    const b = parseInt(range[3], 10);
    const lo = Math.max(1, Math.min(a, b));
    const hi = Math.min(69, Math.max(a, b));
    return { type: "set_constraints", constraints: { whites_min: lo, whites_max: hi } };
  }

  // Constraints: max overlap with last draw "máximo 2 del último sorteo"
  const maxLast = t.match(/máximo\s+([0-5])\s+(del\s+)?(último|ultimo)\s+(sorteo|draw)/);
  if (maxLast) {
    return { type: "set_constraints", constraints: { max_overlap_last_draw: parseInt(maxLast[1], 10) } };
  }

  // Constraints: PB not in last N "pb no repetido en 10"
  const pbNo = t.match(/(pb|powerball)\s+no\s+repetido\s+en\s+([0-9]{1,3})/);
  if (pbNo) {
    return { type: "set_constraints", constraints: { pb_not_in_last_n: parseInt(pbNo[2], 10) } };
  }

  // Constraints: min high "mínimo 2 números 50+"
  const hi50 = t.match(/mínimo\s+([0-5])\s+(números|numeros)\s+50\+/);
  if (hi50) {
    return { type: "set_constraints", constraints: { min_high_50: parseInt(hi50[1], 10) } };
  }

  // Strict anti-overlap
  if (t.includes("modo estricto") || t.includes("estricto") || t.includes("evita overlap")) return { type: "set_strict", enabled: true, overlap_block: 4 };
  if (t.includes("modo normal") || t.includes("desactiva estricto") || t.includes("sin estricto")) return { type: "set_strict", enabled: false };

  return { type: "unknown", text };
}

  if (t.includes("modo auditor")) return { type: "toggle_auditor", enabled: true };
  if (t.includes("auditor off") || t.includes("salir auditor")) return { type: "toggle_auditor", enabled: false };
  if (t.includes("modo demo") || t.includes("demo pitch") || t.includes("presentación")) return { type: "demo_pitch" };
  if (t.includes("más agresivo") || t.includes("agresivo")) return { type: "aggressive_mode" };
  if (t.includes("más conservador") || t.includes("conservador")) return { type: "conservative_mode" };
  if (t.includes("bloquea casi iguales") || t.includes("casi iguales on")) return { type: "block_near_duplicates", enabled: true };
  if (t.includes("casi iguales off") || t.includes("desbloquea casi iguales")) return { type: "block_near_duplicates", enabled: false };
  if (t.includes("genera 50 y optimiza") ) return { type: "gen_and_optimize", n: 50, k: 10 };
  if (t.includes("genera 100 y optimiza") ) return { type: "gen_and_optimize", n: 100, k: 10 };
  if (t.includes("comparar razones") || t.includes("compare reasons")) return { type: "compare_reasons_open" };

  if (t.includes("comparte pack") || t.includes("compartir pack") || t.includes("share pack")) return { type: "share_pack" };

