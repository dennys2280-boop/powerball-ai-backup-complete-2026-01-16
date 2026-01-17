export type Lang = "es" | "en";

export function t(lang: Lang, key: string): string {
  const dict: any = {
    es: {
      ok: "Listo.",
      no_results: "Aún no hay resultados. Di 'ejecuta' primero.",
      slow_on: "Modo lectura lenta activado.",
      slow_off: "Modo lectura lenta desactivado.",
      lang_es: "Modo español activado.",
      lang_en: "English mode enabled.",
    },
    en: {
      ok: "Done.",
      no_results: "No results yet. Say 'run' first.",
      slow_on: "Slow reading mode enabled.",
      slow_off: "Slow reading mode disabled.",
      lang_es: "Spanish mode enabled.",
      lang_en: "English mode enabled.",
    },
  };
  return dict[lang]?.[key] ?? key;
}
