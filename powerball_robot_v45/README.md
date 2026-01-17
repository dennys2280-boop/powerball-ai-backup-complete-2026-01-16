# Bundle


## v3 Upgrades
- Wizard por voz (Modo entrevista) con pasos y confirmación.
- Playground para editar jugadas por voz y re-score via `/api/ai/assistants/rescore`.


## v4 Upgrades
- Pack Inteligente (Modo Mentor): 3 estilos (continuidad / overdue / diversidad) narrados por el robot.
- Modo Estricto anti-overlap: bloquea jugadas demasiado parecidas a sorteos recientes (overlap+PB >= umbral).
- Comandos voz: "pack inteligente", "modo estricto", "modo normal".


## v5 Upgrades
- Autopilot: re-ejecuta automáticamente cambiando seed hasta completar las jugadas o sugerir relajación.
- Explica jugada N: comando voz "explica jugada 4" (opcional "de sequence_hunter") leyendo why/signals del JSON.
- Modo Riesgo por voz: "modo conservador / balanceado / agresivo" ajusta estricto/anti-overlap para explorar más o menos.


## v6 Upgrades
- ABC Compare: comando voz "comparar estrategias" ejecuta 3 corridas (continuidad/diversidad/overdue) y el robot recomienda según métricas del JSON.
- Métricas: continuidad promedio (ventana 10) + diversidad interna (overlap promedio entre sugerencias).


## v7 Upgrades
- Constraints por voz/UI: rango de blancas, máximo overlap con último sorteo, PB no repetido en N, mínimo de altos 50+.
- Anti-similares por niveles (0..3): nivel 2 endurece en últimas 10, nivel 3 además evita PB repetido en últimas 5.
- ABC ganador automático: 'comparar estrategias' ahora selecciona y aplica el ganador balanceado al formulario.


## v8 Upgrades
- Dashboard visual (Heatmap, Gaps/Overdue, Posiciones, Continuidad) + comando voz para mostrar vistas.
- Explain-by-click: lista de jugadas clickeables (usa "explica jugada N").


## v9 Upgrades
- Export Pro: "exporta pack" descarga CSV y abre reporte imprimible (guardar como PDF).
- Perfil: "guarda mi configuración" y "carga mi configuración" usando localStorage.


## v10 Upgrades
- Modo Torneo: ranking competitivo de asistentes (diversidad, score, cantidad) y narración del ganador.


## v11 Upgrades
- Calendario Pro (UI): comando voz activa perfil de seasonality (misma semana del año, ±7 días) listo para backend.


## v12 Upgrades
- Autopilot PRO: cambia seed y relaja filtros en orden seguro si faltan jugadas (sin violar regla no-histórico).


## v13 Upgrades
- Coach Accionable: reglas heurísticas que sugieren ajustes basados en JSON y se aplican con “sí/no”.


## v14 Upgrades
- Packs & Favoritos: guardar packs, listar packs, marcar/quitar favoritos por voz.


## v15 Upgrades
- Accesibilidad & Multi-idioma (UI): english mode / modo español + modo lectura lenta.


## v33 Bonus
- Modo Auditor Narrativo (UI): el robot declara “no está en el JSON” cuando un dato no existe (narración segura).

## v34 Bonus
- Share Pack: /api/share/create y /api/share/{id} para compartir un pack por link/código.

## v35 Bonus
- Presets UI: botones en la pantalla para aplicar presets (diversidad, secuencias, overdue, calendario, balanceado).


## v36–v45 Upgrades
- V36 Compare Reasons: page CompareReasons.tsx (why/tags/signals side-by-side).
- V37 Strategy Mixer: page StrategyMixer.tsx (sliders → assistant mix/preset).
- V38 Constraint Builder: component ConstraintBuilder.tsx (UI → constraints JSON).
- V39 Smart Similarity: near-duplicate filter (router post-proc) blocks 4/5 whites or 3/5 + same PB vs recent.
- V40 Pack Optimizer: /api/optimize/select greedy optimizer (pick best k from many).
- V41 User Goals: goalParser.ts (texto → preset + tweaks).
- V42 Voice Shortcuts: intents (agresivo/conservador, bloquea casi iguales, genera+optimiza, comparar razones, demo).
- V43 Export PDF: /api/export/pdf + pdfExportClient.ts.
- V44 PWA skeleton: manifest + service worker + registerSW.ts.
- V45 Demo Pitch: demo script helper __pb_demoPitch.
