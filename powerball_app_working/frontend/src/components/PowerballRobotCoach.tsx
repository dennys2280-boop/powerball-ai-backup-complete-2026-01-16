import React, { useEffect, useMemo, useRef, useState } from "react";
import { parseRobotIntent } from "../ai/robotProIntents";
import { buildLeagueSummary, speakLines } from "../ai/leagueNarrator";
import { buildMentorPack } from "../ai/mentorPack";
import { auditorLine } from "../ai/auditorNarrator";
import { createShare } from "../ai/shareClient";
import { exportPdf } from "../ai/pdfExportClient";
import { track } from "../ai/telemetryClient";
import { narrateTournament } from "../ai/tournament";
import { generateRecommendations, CoachRecommendation } from "../ai/coachRules";
import { savePack, loadPacks, addFavorite, loadFavorites, removeFavorite } from "../ai/packHistory";
import { t as tr, Lang } from "../ai/i18nSpeech";
import { buildCSVFromResult, downloadText, openPrintableReport } from "../ai/exportPro";
import { saveProfile, loadProfile } from "../ai/profileMemory";
import { summarizeStrategy, pickWinner, pickOverallWinner, StrategyRun } from "../ai/compareABC";

type FormDraft = {
  windows: number[];
  assistant_ids: string[];
  n_suggestions: number;
  seed: number | null;
  strict_mode?: boolean;
  recent_lookback?: number;
  overlap_block?: number;
  similarity_level?: number;
  constraints?: any;
};

type EditableCombo = {
  whites: number[];
  powerball: number;
};

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0;
  u.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function normalizeWhites(ws: number[]) {
  const uniq = Array.from(new Set(ws.map((x) => clamp(Math.round(x), 1, 69))));
  while (uniq.length < 5) uniq.push(clamp(uniq[uniq.length - 1] + 1, 1, 69));
  return uniq.slice(0, 5).sort((a, b) => a - b);
}

export default function PowerballRobotCoach(props: {
  form: FormDraft;
  setForm: (next: FormDraft) => void;
  onRun: () => Promise<void> | void;
  latestResultJson: any;
  onDashboardHighlight?: (h: any) => void;
}) {
  const [open, setOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [bubble, setBubble] = useState(
    "Hola. Puedes decir: 'modo entrevista' (wizard), o 'modo playground' (editar jugada). Comandos rápidos: 'más diversidad', 'más overdue', 'solo secuencias'."
  );
  const [transcript, setTranscript] = useState("");

  // Wizard state
  const [wizard, setWizard] = useState<{
    active: boolean;
    step: "goal" | "windows" | "count" | "seed" | "confirm" | null;
  }>({ active: false, step: null });

  // Playground state
  const [playground, setPlayground] = useState<{ active: boolean; combo: EditableCombo | null; lastRescore?: any }>({
    active: false,
    combo: null,
  });

  const recognitionRef = useRef<any>(null);
  const canSTT = useMemo(() => typeof window !== "undefined" && ("webkitSpeechRecognition" in window), []);

  useEffect(() => {
    if (!canSTT) return;
    const R = (window as any).webkitSpeechRecognition;
    const rec = new R();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "es-ES";

    rec.onresult = (event: any) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const txt = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += txt;
        else interim += txt;
      }
      setTranscript((finalText || interim).trim());
      if (finalText) handleText(finalText);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
  }, [canSTT]);

  function speakLocalized(lines: string[]) {
    // If your speakLines supports rate, you can extend it; here we just chunk and let browser handle.
    // Slow reading: insert short pauses by splitting sentences.
    if (!slowReading) {
      speakLines(lines);
      return;
    }
    const expanded: string[] = [];
    for (const l of lines) {
      // add tiny separators
      expanded.push(l);
      expanded.push(" ");
    }
    speakLines(expanded);
  }

  function say(text: string) {
    setBubble(text);
    speak(text);
  }

  function setWindows(w: number[]) {
    props.setForm({ ...props.form, windows: w });
  }
  function setAssistants(ids: string[]) {
    props.setForm({ ...props.form, assistant_ids: ids });
  }
  function setCount(n: number) {
    props.setForm({ ...props.form, n_suggestions: n });
  }
  function setSeed(seed: number | null) {
    props.setForm({ ...props.form, seed });
  }

  function applyRiskProfile(profile: "conservador" | "balanceado" | "agresivo") {
    if (profile === "conservador") {
      // más filtros / menos repetición cercana
      setStrict(true, 4);
      say("✅ Modo conservador: estricto activado (anti-overlap 4+). Puedes decir 'pack inteligente' o 'modo entrevista'.");
      return;
    }
    if (profile === "agresivo") {
      // más exploración
      setStrict(false);
      say("✅ Modo agresivo: estricto desactivado para explorar más. Recuerda: nunca se repite histórico.");
      return;
    }
    // balanceado
    setStrict(true, 4);
    say("✅ Modo balanceado: estricto activado estándar (anti-overlap 4+). ");
  }

  function mergeConstraints(partial: any) {
    const current = props.form.constraints || {};
    props.setForm({ ...props.form, constraints: { ...current, ...partial } });
  }

  function setSimilarityLevel(level: number) {
    props.setForm({ ...props.form, similarity_level: level });
  }

  function setStrict(enabled: boolean, overlapBlock?: number) {
    props.setForm({
      ...props.form,
      strict_mode: enabled,
      recent_lookback: enabled ? (props.form.recent_lookback ?? 50) : props.form.recent_lookback,
      overlap_block: enabled ? (overlapBlock ?? props.form.overlap_block ?? 4) : props.form.overlap_block,
    });
  }

  async function run() {
    say("Ejecutando análisis y generación. Recuerda: no es predicción.");
    await props.onRun();
    say("Listo. Puedes decir: 'explica resultados' o 'modo playground'.");
  }

  function findPlay(n: number, assistantId?: string) {
    const r = props.latestResultJson?.results_by_assistant || {};
    const idx = Math.max(0, Math.min(49, n - 1));
    if (assistantId && r[assistantId]?.suggestions?.[idx]) return { play: r[assistantId].suggestions[idx], aid: assistantId };
    for (const k of Object.keys(r)) {
      if (r[k]?.suggestions?.[idx]) return { play: r[k].suggestions[idx], aid: k };
    }
    return { play: null, aid: null };
  }

  function explainPlay(n: number, assistantId?: string) {
    const r = props.latestResultJson?.results_by_assistant || {};
    const idx = Math.max(0, Math.min(49, n - 1));
    let found: any = null;
    let foundAid: string | null = null;
    if (assistantId && r[assistantId]?.suggestions?.[idx]) {
      found = r[assistantId].suggestions[idx];
      foundAid = assistantId;
    } else {
      for (const k of Object.keys(r)) {
        if (r[k]?.suggestions?.[idx]) {
          found = r[k].suggestions[idx];
          foundAid = k;
          break;
        }
      }
    }
    if (!found) {
      say("No encontré esa jugada. Ejecuta primero o pide un número válido.");
      return;
    }
    const lines: string[] = [];
    lines.push(`Explicación jugada ${n}${foundAid ? " de " + foundAid : ""}.`);
    lines.push(`Jugada: ${found.whites.join("-")} | PB ${found.powerball}.`);
    if (Array.isArray(found.rationale_tags) && found.rationale_tags.length) {
      lines.push("Tags: " + found.rationale_tags.join(", ") + ".");
    }
    if (Array.isArray(found.why) && found.why.length) {
      lines.push("Por qué: " + found.why.join(" "));
    } else {
      lines.push("Esta sugerencia no incluye 'why'. Activa el modo pro de explicación en backend si falta.");
    }
    if (found.signals_used) {
      const top = Object.entries(found.signals_used)
        .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
        .slice(0, 4)
        .map(([k, v]) => `${k}: ${v}`);
      if (top.length) lines.push("Señales: " + top.join(", ") + ".");
    }
    setBubble(lines.join("\n\n"));
    speakLines(lines);
  }

  async function compareStrategies() {
    // A/B/C: Continuidad vs Diversidad vs Overdue
    const base = {
      draw_date: undefined,
      windows: props.form.windows,
      n_suggestions: props.form.n_suggestions,
      seed: props.form.seed,
      strict_mode: props.form.strict_mode ?? false,
      recent_lookback: props.form.recent_lookback ?? 50,
      overlap_block: props.form.overlap_block ?? 4,
      similarity_level: props.form.similarity_level ?? 1,
      constraints: props.form.constraints ?? undefined,
    };

    const configs: Array<{ id: any; label: string; assistants: string[] }> = [
      { id: "continuity", label: "A: Continuidad", assistants: ["sequence_hunter"] },
      { id: "diversity", label: "B: Diversidad", assistants: ["diversity_optimizer"] },
      { id: "overdue", label: "C: Overdue", assistants: ["hot_cold_statistician"] },
    ];

    say("Comparación A B C activada. Ejecutaré continuidad, diversidad y overdue y luego te digo cuál conviene hoy.");
    const runs: StrategyRun[] = [];
    for (const cfg of configs) {
      const payload = { ...base, assistant_ids: cfg.assistants };
      const res = await fetch("http://localhost:8000/api/ai/assistants/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      runs.push({ id: cfg.id, label: cfg.label, assistants: cfg.assistants, result: json });
    }

    const summaries = runs.map((r) => summarizeStrategy(r, 10));
    const winner = pickWinner(summaries);
    const overallWinner = pickOverallWinner(summaries);

    const lines: string[] = [];
    lines.push("Comparación A/B/C lista.");
    for (const s of summaries) {
      if (!s.ok) {
        lines.push(`${s.label}: error (${s.message}).`);
        continue;
      }
      lines.push(
        `${s.label}: ${s.count} jugadas. Continuidad promedio ventana 10: ${s.continuity_avg_overlap}. Diversidad interna (overlap medio): ${s.internal_avg_overlap}.`
      );
    }

    if (overallWinner) {
      // Auto-apply winner configuration to the form
      const map: any = {
        continuity: ["sequence_hunter"],
        diversity: ["diversity_optimizer"],
        overdue: ["hot_cold_statistician"],
      };
      props.setForm({ ...props.form, assistant_ids: map[overallWinner.id] || props.form.assistant_ids });
      lines.push(`Ganador automático (balance): ${overallWinner.label}. Dejé el formulario listo con esa estrategia.`);
    }

    if (winner) {
      lines.push(`Ganador continuidad: ${winner.continuity.label}.`);
      lines.push(`Ganador diversidad: ${winner.diversity.label}.`);
      lines.push("Si quieres priorizar continuidad, di: 'solo secuencias'. Si quieres variedad, di: 'más diversidad'. Si quieres atrasados, di: 'más overdue'.");
    }

    setBubble(lines.join("\n\n"));
    speakLines(lines);
  }

  async function autopilot(maxTries = 4) {
    // Auto-rerun with different seeds until every active assistant has enough suggestions (or we hit max tries)
    const desired = props.form.n_suggestions ?? 10;
    const activeAssistants = props.form.assistant_ids?.length ? props.form.assistant_ids : null;
    const needMore = (json: any) => {
      if (!json || json.status !== "ok") return true;
      const by = json.results_by_assistant || {};
      const ids = activeAssistants || Object.keys(by);
      for (const id of ids) {
        const got = (by[id]?.suggestions || []).length;
        if (got < desired) return true;
      }
      return false;
    };

    say("Autopilot activado. Voy a intentar completar las jugadas automáticamente.");
    for (let attempt = 1; attempt <= maxTries; attempt++) {
      // if seed is null, set a random seed to explore
      const nextSeed = Math.floor(Math.random() * 1_000_000);
      props.setForm({ ...props.form, seed: nextSeed });
      await props.onRun();
      const json = (window as any).__latestAIAssistantsJson || props.latestResultJson;
      if (!needMore(json)) {
        say(`Listo. Autopilot completó las jugadas en intento ${attempt}. Puedes decir 'pack inteligente' o 'explica jugada 1'.`);
        return;
      }
    }
    say("Autopilot terminó. Aún faltan jugadas por filtros. Si quieres explorar más, di 'modo agresivo' o desactiva estricto.");
  }

  function coachRecommend() {
    if (!props.latestResultJson || props.latestResultJson.status !== 'ok') {
      say(tr(lang, 'no_results'));
      return;
    }
    const recs = generateRecommendations(props.latestResultJson);
    if (!recs.length) {
      say('No veo ajustes urgentes. Si quieres, di: comparar estrategias.');
      return;
    }
    const rec = recs[0];
    setPendingCoach(rec);
    setBubble(rec.say.join('\n\n'));
    speakLocalized(rec.say);
  }

  function coachYes() {
    if (!pendingCoach) {
      say('No hay recomendación pendiente.');
      return;
    }
    const next = pendingCoach.patchForm(props.form);
    props.setForm(next);
    say('Aplicado. Di "ejecuta" para correr con la nueva configuración.');
    setPendingCoach(null);
  }

  function coachNo() {
    setPendingCoach(null);
    say('Ok.');
  }

  function mentorPack() {
    const pack = buildMentorPack(props.latestResultJson);
    if (!pack) {
      say("Aún no hay resultados. Di 'ejecuta' primero.");
      return;
    }
    const lines: string[] = [];
    lines.push("Pack inteligente listo. Te doy 3 estilos para hoy.");
    for (const section of pack) {
      lines.push(section.title + ":");
      const sug = section.suggestions || [];
      if (!sug.length) {
        lines.push("(sin jugadas en esta sección)");
        continue;
      }
      for (let i = 0; i < sug.length; i++) {
        const s = sug[i];
        lines.push(`${i + 1}. ${s.whites.join('-')} | PB ${s.powerball}`);
      }
      const first = sug[0];
      if (first?.why?.length) lines.push("Por qué: " + first.why.slice(0, 2).join(" "));
    }
    setBubble(lines.join("\n\n"));
    speakLines(lines);
  }

  function explain() {
    const lines = buildLeagueSummary(props.latestResultJson, 10);
    setBubble(lines.join("\n\n"));
    speakLines(lines);
  }

  function wizardStart() {
    setWizard({ active: true, step: "goal" });
    say("Modo entrevista activado. Primero: ¿qué objetivo quieres? Di: continuidad, diversidad, overdue o mixto.");
  }

  function wizardCancel() {
    setWizard({ active: false, step: null });
    say("Modo entrevista cancelado.");
  }

  function wizardAdvance(next: any) {
    setWizard(next);
  }

  function goalToAssistants(goal: "continuity" | "diversity" | "overdue" | "mixed") {
    if (goal === "continuity") return ["sequence_hunter"];
    if (goal === "diversity") return ["diversity_optimizer"];
    if (goal === "overdue") return ["hot_cold_statistician"];
    return [
      "hot_cold_statistician",
      "sequence_hunter",
      "positional_tactician",
      "date_historian",
      "probability_purist",
      "diversity_optimizer",
    ];
  }

  function playgroundStart() {
    // default load: first available suggestion
    const r = props.latestResultJson?.results_by_assistant || {};
    let first: any = null;
    for (const k of Object.keys(r)) {
      const s = r[k]?.suggestions || [];
      if (s.length) {
        first = s[0];
        break;
      }
    }
    const combo = first
      ? { whites: [...first.whites], powerball: first.powerball }
      : { whites: [1, 2, 3, 4, 5], powerball: 1 };
    setPlayground({ active: true, combo: { whites: normalizeWhites(combo.whites), powerball: clamp(combo.powerball, 1, 26) } });
    say("Modo playground activado. Di: 'cambia 34 por 41', 'powerball 12', o 'rescore'. También puedes decir: 'carga jugada 2 de sequence_hunter'.");
  }

  function findSuggestion(aid?: string, index?: number) {
    const r = props.latestResultJson?.results_by_assistant || {};
    const idx = typeof index === "number" ? index : 0;
    if (aid && r[aid]?.suggestions?.[idx]) return r[aid].suggestions[idx];
    // fallback: scan
    for (const k of Object.keys(r)) {
      if (r[k]?.suggestions?.[idx]) return r[k].suggestions[idx];
    }
    return null;
  }

  async function rescoreCurrent() {
    if (!playground.combo) {
      say("No hay jugada cargada. Di: 'modo playground' o 'carga jugada 1'.");
      return;
    }
    const payload = {
      draw_date: undefined,
      windows: props.form.windows,
      assistant_ids: props.form.assistant_ids?.length ? props.form.assistant_ids : undefined,
      whites: playground.combo.whites,
      powerball: playground.combo.powerball,
    };

    const res = await fetch("http://localhost:8000/api/ai/assistants/rescore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setPlayground((p) => ({ ...p, lastRescore: json }));

    if (json.status !== "ok") {
      say(`No pude evaluar: ${json.message || "error"}`);
      return;
    }

    if (json.is_historical) {
      say("⚠️ Esa jugada coincide con una combinación histórica. No está permitida. Cambia 1 o 2 números y vuelve a evaluar.");
      return;
    }

    // Summarize best assistant score
    const by = json.rescore_by_assistant || {};
    const entries = Object.entries(by).map(([k, v]: any) => [k, v.score] as [string, number]);
    entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    const best = entries[0];
    const bestWhy = (by?.[best?.[0]]?.why || []).slice(0, 2).join(" ");

    say(
      `Evaluación lista. Jugada: ${json.input.whites.join("-")} | PB ${json.input.powerball}. ` +
        (best ? `Mejor encaje: ${best[0]} (score ${best[1]}). ` : "") +
        (bestWhy ? `Por qué: ${bestWhy}` : "")
    );
  }

  function handleWizard(intent: any) {
    if (!wizard.active) return false;

    if (intent.type === "wizard_cancel") {
      wizardCancel();
      return true;
    }

    if (wizard.step === "goal" && intent.type === "set_goal") {
      const ids = goalToAssistants(intent.goal);
      setAssistants(ids);
      wizardAdvance({ active: true, step: "windows" });
      say(`Perfecto. Objetivo ${intent.goal}. Ahora di las ventanas: por ejemplo "ventanas 5 10 20".`);
      return true;
    }

    if (wizard.step === "windows" && intent.type === "set_windows") {
      setWindows(intent.windows);
      wizardAdvance({ active: true, step: "count" });
      say(`Ok. Ventanas: ${intent.windows.join(", ")}. ¿Cuántas jugadas por asistente? Di "10 jugadas".`);
      return true;
    }

    if (wizard.step === "count" && intent.type === "set_count") {
      setCount(intent.n);
      wizardAdvance({ active: true, step: "seed" });
      say(`Listo. ${intent.n} jugadas. ¿Quieres seed? Di "seed 123" o di "sin seed".`);
      return true;
    }

    if (wizard.step === "seed") {
      if (intent.type === "set_seed") {
        setSeed(intent.seed);
        wizardAdvance({ active: true, step: "confirm" });
        say(`Seed ${intent.seed}. ¿Confirmas ejecutar? Di "sí" o "no".`);
        return true;
      }
      if ((intent.text || "").toLowerCase?.().includes("sin seed")) {
        setSeed(null);
        wizardAdvance({ active: true, step: "confirm" });
        say(`Ok sin seed. ¿Confirmas ejecutar? Di "sí" o "no".`);
        return true;
      }
    }

    if (wizard.step === "confirm") {
      if (intent.type === "wizard_confirm") {
        setWizard({ active: false, step: null });
        run();
        return true;
      }
      if (intent.type === "wizard_reject") {
        say("Ok, no ejecuto. Puedes decir: 'ventanas ...', '10 jugadas' o 'modo entrevista' para reiniciar.");
        setWizard({ active: false, step: null });
        return true;
      }
    }

    return false;
  }

  function handlePlayground(intent: any) {
    if (!playground.active) return false;

    if (intent.type === "wizard_cancel") {
      setPlayground({ active: false, combo: null });
      say("Modo playground desactivado.");
      return true;
    }

    if (intent.type === "load_suggestion") {
      const s = findSuggestion(intent.assistant_id, intent.index);
      if (!s) {
        say("No encontré esa jugada. Prueba: 'carga jugada 1' o ejecuta primero.");
        return true;
      }
      setPlayground((p) => ({
        ...p,
        combo: { whites: normalizeWhites(s.whites), powerball: clamp(s.powerball, 1, 26) },
      }));
      say(`Jugada cargada: ${normalizeWhites(s.whites).join("-")} | PB ${clamp(s.powerball, 1, 26)}. Di 'cambia X por Y' o 'rescore'.`);
      return true;
    }

    if (intent.type === "replace_number" && playground.combo) {
      const ws = [...playground.combo.whites];
      const from = intent.from;
      const to = clamp(intent.to, 1, 69);
      const idx = ws.indexOf(from);
      if (idx >= 0) ws[idx] = to;
      else ws[ws.length - 1] = to;

      const norm = normalizeWhites(ws);
      setPlayground((p) => ({ ...p, combo: { ...p.combo!, whites: norm } }));
      say(`Ok. Ahora: ${norm.join("-")} | PB ${playground.combo.powerball}. Di 'rescore'.`);
      return true;
    }

    if (intent.type === "set_powerball" && playground.combo) {
      const pb = clamp(intent.pb, 1, 26);
      setPlayground((p) => ({ ...p, combo: { ...p.combo!, powerball: pb } }));
      say(`Powerball actualizado a ${pb}. Di 'rescore' para evaluar.`);
      return true;
    }

    if (intent.type === "rescore") {
      rescoreCurrent();
      return true;
    }

    return false;
  }

  function handleText(text: string) {
    const intent = parseRobotIntent(text);

    // Start modes
    if (intent.type === "wizard_start") {
      wizardStart();
      return;
    }
    if (intent.type === "playground_start") {
      playgroundStart();
      return;
    }

    // If wizard is active, it consumes intents first
    if (handleWizard({ ...intent, text })) return;

    // If playground active, handle next
    if (handlePlayground({ ...intent, text })) return;

    // Regular behavior
    switch (intent.type) {
      case "set_windows":
        setWindows(intent.windows);
        say(`✅ Ventanas actualizadas: ${intent.windows.join(", ")}.`);
        return;
      case "set_count":
        setCount(intent.n);
        say(`✅ Jugadas por asistente: ${intent.n}.`);
        return;
      case "set_seed":
        setSeed(intent.seed);
        say(`✅ Seed configurada: ${intent.seed}.`);
        return;
      case "set_assistants":
        setAssistants(intent.assistant_ids);
        say(`✅ Asistentes: ${intent.assistant_ids.join(", ")}.`);
        return;
      case "run":
        run();
        return;
      case "explain":
        explain();
        return;
      case "mentor_pack":
        mentorPack();
        return;

      case "set_similarity_level":
        setSimilarityLevel(intent.level);
        setStrict(intent.level > 0, props.form.overlap_block ?? 4);
        say(`✅ Anti-similares nivel ${intent.level} configurado.`);
        return;

      case "set_constraints":
        mergeConstraints(intent.constraints);
        say(`✅ Restricciones actualizadas: ${JSON.stringify(intent.constraints)}.`);
        return;

      case "set_strict":
        setStrict(intent.enabled, intent.overlap_block);
        say(intent.enabled ? `✅ Modo estricto activado (anti-overlap ${intent.overlap_block ?? 4}+).` : "✅ Modo estricto desactivado.");
        return;

      case "set_risk":
        applyRiskProfile(intent.profile);
        return;

      case "explain_play":
        explainPlay(intent.n, intent.assistant_id);
        return;

      case "autopilot":
        autopilot();
        return;

      case "help":
        say(
          `Comandos: 'modo torneo', 'modo calendario pro', 'autopilot pro', 'recomiéndame ajustes', 'guarda este pack', 'mis packs', 'marca jugada 3', 'mis favoritos', 'modo lectura lenta', 'english mode'. Comandos: 'modo entrevista', 'pack inteligente', 'modo estricto', 'anti similares nivel 2', 'solo 10 a 60', 'máximo 2 del último sorteo', 'pb no repetido en 10', 'mínimo 2 números 50+', 'modo playground', 'modo conservador', 'modo agresivo', 'explica jugada 3', 'autopilot', ventanas 2 5 10, 10 jugadas, seed 123, más diversidad, más overdue, solo secuencias, ejecuta, explica resultados, cambia 34 por 41, powerball 12, rescore.`
        );
        return;
      default:
        say(`No entendí: "${text}". Di "ayuda" para ejemplos.`);
        return;
    }
  }

  function toggleMic() {
    if (!canSTT) {
      say("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setTranscript("");
    setListening(true);
    recognitionRef.current?.start();
    say("Te escucho…");
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ position: "fixed", right: 16, bottom: 16, padding: 12, borderRadius: 999 }}>
        🤖
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 410,
        background: "#0f172a",
        color: "#e2e8f0",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "#111827" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <RobotAvatar listening={listening} />
          <div>
            <div style={{ fontWeight: 700 }}>Robot Powerball</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {wizard.active ? `Modo entrevista (${wizard.step})` : playground.active ? "Modo playground" : "Coach por voz"}
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: "transparent", color: "#e2e8f0" }}>
          ✕
        </button>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, lineHeight: 1.35, background: "#111827", borderRadius: 12, padding: 10, whiteSpace: "pre-wrap" }}>
          {bubble}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            onClick={toggleMic}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              background: listening ? "#ef4444" : "#1f2937",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {listening ? "⏹ Detener" : "🎤 Hablar"}
          </button>

          <button
            onClick={() => run()}
            style={{
              padding: 10,
              borderRadius: 12,
              background: "#1f2937",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ▶ Run
          </button>

          <button
            onClick={() => explain()}
            style={{
              padding: 10,
              borderRadius: 12,
              background: "#1f2937",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            🗣 Explicar
          </button>
        </div>

        {transcript && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            <div style={{ opacity: 0.7 }}>Escuché:</div>
            <div style={{ background: "#0b1220", padding: 8, borderRadius: 10 }}>{transcript}</div>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, background: "#0b1220", padding: 10, borderRadius: 12 }}>
          <div>
            <b>Ventanas:</b> {props.form.windows.join(", ") || "—"}
          </div>
          <div>
            <b>Asistentes:</b> {props.form.assistant_ids.join(", ") || "—"}
          </div>
          <div>
            <b>Jugadas:</b> {props.form.n_suggestions || "—"}
          </div>
          <div>
            <b>Seed:</b> {props.form.seed ?? "—"}
          </div>
        </div>

        {playground.active && playground.combo && (
          <div style={{ marginTop: 10, fontSize: 12, background: "#0b1220", padding: 10, borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Playground</div>
            <div>
              <b>Jugada:</b> {playground.combo.whites.join("-")} | PB {playground.combo.powerball}
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
              <button onClick={() => rescoreCurrent()} style={{ padding: 8, borderRadius: 10, background: "#1f2937", color: "white" }}>
                🔎 Rescore
              </button>
              <button
                onClick={() => {
                  setPlayground({ active: false, combo: null });
                  say("Modo playground desactivado.");
                }}
                style={{ padding: 8, borderRadius: 10, background: "#1f2937", color: "white" }}
              >
                ✖ Salir
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
          Tips: “modo entrevista”, “pack inteligente”, “modo estricto”, “modo playground”, “modo conservador”, “modo agresivo”, “explica jugada 3”, “autopilot, comparar estrategias”, “carga jugada 2 de sequence_hunter”, “cambia 34 por 41”, “powerball 12”, “rescore”.
        </div>
      </div>
    </div>
  );
}

function RobotAvatar({ listening }: { listening: boolean }) {
  return (
    <svg width="44" height="44" viewBox="0 0 64 64">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="14" y="16" width="36" height="30" rx="10" fill="#0ea5e9" />
      <rect x="18" y="20" width="28" height="22" rx="8" fill="#082f49" />

      <circle cx="28" cy="31" r="4" fill={listening ? "#f87171" : "#22c55e"} filter="url(#glow)" />
      <circle cx="40" cy="31" r="4" fill={listening ? "#f87171" : "#22c55e"} filter="url(#glow)" />

      <rect x="30.5" y="8" width="3" height="10" rx="1.5" fill="#94a3b8" />
      <circle cx="32" cy="8" r="3" fill={listening ? "#f87171" : "#a78bfa"} filter="url(#glow)" />

      <rect x="26" y="38" width="12" height="2.8" rx="1.4" fill="#94a3b8" />
    </svg>
  );
}


// V33/V34 helpers (appended)
async function __pb_sharePack(props: any, say: any, setBubble: any) {
  if (!props.latestResultJson || props.latestResultJson.status !== "ok") {
    say("No hay resultados para compartir. Di 'ejecuta' primero.");
    return;
  }
  try {
    const payload = { meta: props.latestResultJson.meta, constraints: props.latestResultJson.constraints, results_by_assistant: props.latestResultJson.results_by_assistant };
    const res = await createShare(payload, "shared pack");
    if (res?.status === "ok" && res.share_id) {
      const code = res.share_id;
      const link = `${window.location.origin}/share/${code}`;
      setBubble(`Share ID: ${code}\n${link}`);
      say(`Listo. Creé un link para compartir. Código ${code}.`);
      track("share_pack", { code });
    } else {
      setBubble(JSON.stringify(res, null, 2));
      say("No pude crear el link.");
    }
  } catch {
    say("Error creando link de compartir.");
  }
}


// V45 demo pitch (append-only; wire in switch manually in your app)
export async function __pb_demoPitch(say: (t:string)=>void) {
  const steps = [
    "Hola. Soy tu robot Powerball AI. Te mostraré el flujo completo en 30 segundos.",
    "Paso 1: seleccionamos un preset. Por ejemplo: Balanceado.",
    "Paso 2: ejecutamos asistentes y comparamos estrategias.",
    "Paso 3: optimizamos el pack final maximizando diversidad y cobertura.",
    "Paso 4: exportamos un PDF y lo compartimos por link.",
    "Listo. Di: 'preset balanceado' y luego 'ejecuta'.",
  ];
  for (const s of steps) {
    say(s);
    await new Promise((r) => setTimeout(r, 700));
  }
}
