import React, { useState } from "react";
import PowerballRobotCoach from "../components/PowerballRobotCoach";

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

// Mock data for testing
const mockResultJson = {
  results_by_assistant: {
    sequence_hunter: {
      assistant_id: "sequence_hunter",
      suggestions: [
        {
          whites: [5, 12, 23, 45, 67],
          powerball: 15,
          score: 0.85,
          why: "Based on sequence patterns from last 10 draws",
          signals: ["ascending_sequence", "hot_numbers"],
          tags: ["sequence", "hot"]
        },
        {
          whites: [8, 19, 34, 51, 62],
          powerball: 22,
          score: 0.78,
          why: "Gap analysis suggests these numbers are due",
          signals: ["gap_pattern", "overdue"],
          tags: ["gap", "overdue"]
        },
        {
          whites: [3, 17, 28, 44, 59],
          powerball: 8,
          score: 0.72,
          why: "Positional frequency analysis",
          signals: ["positional", "frequency"],
          tags: ["position", "freq"]
        }
      ]
    },
    diversity_engine: {
      assistant_id: "diversity_engine",
      suggestions: [
        {
          whites: [11, 25, 38, 52, 66],
          powerball: 19,
          score: 0.81,
          why: "Maximum spread across number range",
          signals: ["high_diversity", "balanced"],
          tags: ["diverse", "balanced"]
        },
        {
          whites: [7, 22, 41, 55, 68],
          powerball: 3,
          score: 0.76,
          why: "Odd/even balance with good distribution",
          signals: ["odd_even_balance", "spread"],
          tags: ["balance", "spread"]
        }
      ]
    },
    overdue_tracker: {
      assistant_id: "overdue_tracker",
      suggestions: [
        {
          whites: [2, 14, 33, 47, 61],
          powerball: 26,
          score: 0.79,
          why: "Numbers with longest absence from draws",
          signals: ["max_gap", "cold_numbers"],
          tags: ["overdue", "cold"]
        },
        {
          whites: [9, 21, 36, 54, 69],
          powerball: 11,
          score: 0.74,
          why: "Statistical reversion expected",
          signals: ["reversion", "statistical"],
          tags: ["stats", "reversion"]
        }
      ]
    }
  },
  meta: {
    total_suggestions: 7,
    execution_time_ms: 245,
    windows_used: [10, 25, 50],
    timestamp: new Date().toISOString()
  }
};

export default function RobotCoachPage() {
  const [form, setForm] = useState<FormDraft>({
    windows: [10, 25, 50],
    assistant_ids: ["sequence_hunter", "diversity_engine", "overdue_tracker"],
    n_suggestions: 5,
    seed: null,
    strict_mode: false,
    recent_lookback: 50,
    overlap_block: 4,
    similarity_level: 1,
    constraints: {}
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleRun = async () => {
    setLoading(true);
    addLog("Ejecutando analisis con Robot Coach...");
    addLog(`Configuracion: windows=${form.windows.join(",")}, assistants=${form.assistant_ids.join(",")}`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setResult(mockResultJson);
    addLog("Analisis completado. " + mockResultJson.meta.total_suggestions + " sugerencias generadas.");
    setLoading(false);
  };

  const handleDashboardHighlight = (highlight: any) => {
    addLog(`Dashboard highlight: ${JSON.stringify(highlight)}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="text-5xl">🤖</div>
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Powerball Robot Coach v45</h1>
            <p className="text-gray-400">Sistema de asistentes IA para analisis de Powerball</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Control */}
          <div className="lg:col-span-1 space-y-4">
            {/* Configuracion */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-semibold text-cyan-400 mb-4">⚙️ Configuracion</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ventanas de analisis</label>
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map(w => (
                      <button
                        key={w}
                        onClick={() => {
                          const newWindows = form.windows.includes(w)
                            ? form.windows.filter(x => x !== w)
                            : [...form.windows, w].sort((a,b) => a-b);
                          setForm({...form, windows: newWindows});
                          addLog(`Ventana ${w} ${form.windows.includes(w) ? 'removida' : 'agregada'}`);
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          form.windows.includes(w)
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Asistentes IA</label>
                  <div className="space-y-1">
                    {['sequence_hunter', 'diversity_engine', 'overdue_tracker', 'continuity_checker'].map(aid => (
                      <label key={aid} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.assistant_ids.includes(aid)}
                          onChange={(e) => {
                            const newIds = e.target.checked
                              ? [...form.assistant_ids, aid]
                              : form.assistant_ids.filter(x => x !== aid);
                            setForm({...form, assistant_ids: newIds});
                            addLog(`Asistente ${aid} ${e.target.checked ? 'activado' : 'desactivado'}`);
                          }}
                          className="rounded bg-gray-700"
                        />
                        <span className="text-gray-300">{aid.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sugerencias: {form.n_suggestions}</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={form.n_suggestions}
                    onChange={(e) => setForm({...form, n_suggestions: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.strict_mode}
                    onChange={(e) => {
                      setForm({...form, strict_mode: e.target.checked});
                      addLog(`Modo estricto ${e.target.checked ? 'activado' : 'desactivado'}`);
                    }}
                    className="rounded bg-gray-700"
                  />
                  <span className="text-sm text-gray-300">Modo Estricto (anti-overlap)</span>
                </div>
              </div>
            </div>

            {/* Comandos Rapidos */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-semibold text-yellow-400 mb-4">⚡ Comandos Rapidos</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setForm({...form, assistant_ids: ['diversity_engine']}); addLog('Preset: Solo diversidad'); }}
                  className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded text-sm text-purple-300"
                >
                  🎯 Diversidad
                </button>
                <button
                  onClick={() => { setForm({...form, assistant_ids: ['sequence_hunter']}); addLog('Preset: Solo secuencias'); }}
                  className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 rounded text-sm text-blue-300"
                >
                  📈 Secuencias
                </button>
                <button
                  onClick={() => { setForm({...form, assistant_ids: ['overdue_tracker']}); addLog('Preset: Solo overdue'); }}
                  className="px-3 py-2 bg-orange-600/30 hover:bg-orange-600/50 rounded text-sm text-orange-300"
                >
                  ⏰ Overdue
                </button>
                <button
                  onClick={() => {
                    setForm({...form, assistant_ids: ['sequence_hunter', 'diversity_engine', 'overdue_tracker']});
                    addLog('Preset: Todos los asistentes');
                  }}
                  className="px-3 py-2 bg-green-600/30 hover:bg-green-600/50 rounded text-sm text-green-300"
                >
                  🔄 Todos
                </button>
                <button
                  onClick={() => { setForm({...form, strict_mode: true, overlap_block: 4}); addLog('Modo conservador activado'); }}
                  className="px-3 py-2 bg-gray-600/30 hover:bg-gray-600/50 rounded text-sm text-gray-300"
                >
                  🛡️ Conservador
                </button>
                <button
                  onClick={() => { setForm({...form, strict_mode: false}); addLog('Modo agresivo activado'); }}
                  className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 rounded text-sm text-red-300"
                >
                  🔥 Agresivo
                </button>
              </div>
            </div>

            {/* Log de Actividad */}
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h2 className="text-lg font-semibold text-green-400 mb-4">📋 Log de Actividad</h2>
              <div className="h-40 overflow-y-auto text-xs font-mono bg-gray-900 rounded p-2 space-y-1">
                {logs.length === 0 ? (
                  <p className="text-gray-500">Sin actividad...</p>
                ) : (
                  logs.slice(-20).map((log, i) => (
                    <p key={i} className="text-gray-400">{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Robot Coach */}
          <div className="lg:col-span-2 space-y-4">
            {/* Robot Interface */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <PowerballRobotCoach
                form={form}
                setForm={(newForm) => {
                  setForm(newForm);
                  addLog('Formulario actualizado por Robot Coach');
                }}
                onRun={handleRun}
                latestResultJson={result}
                onDashboardHighlight={handleDashboardHighlight}
              />
            </div>

            {/* Resultados */}
            {result && (
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h2 className="text-lg font-semibold text-cyan-400 mb-4">📊 Resultados del Analisis</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-cyan-400">{result.meta.total_suggestions}</p>
                    <p className="text-xs text-gray-400">Sugerencias</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{result.meta.execution_time_ms}ms</p>
                    <p className="text-xs text-gray-400">Tiempo</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{Object.keys(result.results_by_assistant).length}</p>
                    <p className="text-xs text-gray-400">Asistentes</p>
                  </div>
                </div>

                {/* Sugerencias por Asistente */}
                <div className="space-y-4">
                  {Object.entries(result.results_by_assistant).map(([aid, data]: [string, any]) => (
                    <div key={aid} className="bg-gray-700/30 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-cyan-300 mb-2">
                        🤖 {aid.replace('_', ' ').toUpperCase()}
                      </h3>
                      <div className="space-y-2">
                        {data.suggestions.map((s: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-800 rounded p-2">
                            <div className="flex gap-1">
                              {s.whites.map((n: number, i: number) => (
                                <span key={i} className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center text-sm font-bold">
                                  {n}
                                </span>
                              ))}
                              <span className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold">
                                {s.powerball}
                              </span>
                            </div>
                            <div className="flex-1 text-xs text-gray-400">
                              <p>{s.why}</p>
                              <div className="flex gap-1 mt-1">
                                {s.tags.map((tag: string) => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-gray-600 rounded text-xs">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400">{(s.score * 100).toFixed(0)}%</p>
                              <p className="text-xs text-gray-500">score</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Boton de Ejecutar */}
            <button
              onClick={handleRun}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Analizando...
                </span>
              ) : (
                '🚀 Ejecutar Analisis con Robot Coach'
              )}
            </button>
          </div>
        </div>

        {/* Instrucciones de Voz */}
        <div className="mt-8 bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4">🎤 Comandos de Voz Disponibles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Modos</h3>
              <ul className="text-gray-400 space-y-1">
                <li>"modo entrevista"</li>
                <li>"modo playground"</li>
                <li>"modo estricto"</li>
                <li>"modo normal"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Estrategias</h3>
              <ul className="text-gray-400 space-y-1">
                <li>"mas diversidad"</li>
                <li>"mas overdue"</li>
                <li>"solo secuencias"</li>
                <li>"pack inteligente"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Riesgo</h3>
              <ul className="text-gray-400 space-y-1">
                <li>"modo conservador"</li>
                <li>"modo balanceado"</li>
                <li>"modo agresivo"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-2">Acciones</h3>
              <ul className="text-gray-400 space-y-1">
                <li>"ejecutar"</li>
                <li>"explica jugada N"</li>
                <li>"comparar estrategias"</li>
                <li>"exporta pack"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
