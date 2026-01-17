// leagueNarrator.ts - League narration utilities

export function buildLeagueSummary(results: any): string[] {
  const lines: string[] = [];

  if (!results || !results.results_by_assistant) {
    return ["No hay resultados disponibles para narrar."];
  }

  const assistants = Object.keys(results.results_by_assistant);
  lines.push(`Resumen de ${assistants.length} asistentes:`);

  for (const aid of assistants) {
    const data = results.results_by_assistant[aid];
    const count = data?.suggestions?.length || 0;
    lines.push(`- ${aid.replace('_', ' ')}: ${count} sugerencias`);
  }

  return lines;
}

export function speakLines(lines: string[]): void {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  for (const line of lines) {
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "es-ES";
    window.speechSynthesis.speak(utterance);
  }
}

export function narrateLeagueResult(result: any): void {
  const lines = buildLeagueSummary(result);
  speakLines(lines);
}
