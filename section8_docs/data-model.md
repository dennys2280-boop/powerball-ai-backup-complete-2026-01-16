# Powerball Analytics — Data Model (v1.0)

## 0. Goals

- Mantener histórico oficial inmutable
- Garantizar idempotencia (sync e imports repetidos no duplican)
- Auditar todo (quién, cómo, cuándo, fuente)
- Soportar: Official Results, Played (tickets/combinations), Future Quick Picks, Analytics

## 1. Time & IDs

- DB timestamps: UTC (TIMESTAMPTZ)
- UI convierte a timezone local
- Identificadores: UUID (v4) para entidades internas
- “Draw Date”: fecha del sorteo (DATE) + opcional “draw_time” (TIMESTAMPTZ)

## 2. Core Entities (High-level)

### 2.1 Draw

Representa un sorteo único.
Fields:

- id (uuid)
- draw_date (date) // fecha del sorteo
- draw_datetime_utc (timestamptz, nullable) // si se conoce exacto
- game (text) default 'powerball'
- created_at, updated_at

Constraints:

- unique (game, draw_date)

### 2.2 OfficialResult (Immutable)

Resultados oficiales del sitio Powerball.
Fields:

- id (uuid)
- draw_id (fk -> Draw.id)
- white_1..white_5 (int)
- powerball (int)
- power_play (int, nullable)
- source (text) = 'powerball.com' (o similar)
- source_url (text, nullable)
- fetched_at (timestamptz)
- checksum (text) // hash del payload o HTML parseado
- created_at

Constraints:

- unique (draw_id)
- validation:
  - white_1..white_5 ∈ [1..69]
  - powerball ∈ [1..26] (si el juego actual aplica; si cambian reglas, versionar)
  - white balls deben ordenarse ascendente al guardar (normalización)

**Inmutabilidad**

- No UPDATE/DELETE por UI. Solo “append-only” via migrations o admin tooling controlado.

### 2.3 JackpotSnapshot

Jackpot y cash value (pueden variar con el tiempo antes del sorteo).
Fields:

- id (uuid)
- draw_id (fk)
- jackpot_amount (numeric)
- cash_value_amount (numeric)
- currency (text) default 'USD'
- fetched_at (timestamptz)
- source (text)
- created_at

Constraints:

- allow multiple per draw (snapshots)
- index (draw_id, fetched_at desc)

### 2.4 ImportBatch

Audita importaciones.
Fields:

- id (uuid)
- import_type (enum) ['HISTORICAL_OFFICIAL','PLAYED_EXCEL','PLAYED_MANUAL','PLAYED_OCR','FUTURE_QUICKPICKS']
- source_file_name (text, nullable)
- source_file_hash (text, nullable)
- source_notes (text, nullable)
- status (enum) ['PENDING','COMPLETED','FAILED']
- created_by (text/user_id)
- created_at, completed_at (timestamptz, nullable)

Constraints:

- (import_type, source_file_hash) unique cuando aplique (para idempotencia)

### 2.5 PlayedTicket

Representa un ticket jugado (puede contener múltiples combinaciones).
Fields:

- id (uuid)
- draw_id (fk) // a qué sorteo corresponde
- import_batch_id (fk)
- input_method (enum) ['MANUAL','EXCEL','OCR']
- purchase_amount (numeric, nullable)
- notes (text, nullable)
- created_at

### 2.6 PlayedCombination

Una combinación jugada asociada a un ticket.
Fields:

- id (uuid)
- played_ticket_id (fk)
- draw_id (fk)
- white_1..white_5 (int)
- powerball (int)
- power_play (int, nullable)
- is_winner (boolean, nullable) // se setea al clasificar
- prize_amount (numeric, nullable)
- classification_run_id (uuid, nullable) // auditoría del proceso de clasificación
- created_at

Constraints:

- unique (draw_id, played_ticket_id, white_1..white_5, powerball, power_play) // evita duplicados en el mismo ticket
- validación rangos igual que OfficialResult

### 2.7 QuickPickGenerated (Future)

Combinaciones generadas por el sistema.
Fields:

- id (uuid)
- draw_id (fk, nullable) // si ya están asociadas a un draw futuro específico
- generated_at (timestamptz)
- generator_version (text) // versionado del algoritmo
- inputs_fingerprint (text) // hash de filtros/config usados
- white_1..white_5 (int)
- powerball (int)
- weight_score (numeric, nullable) // opcional
- import_batch_id (fk, nullable) // si se importan desde archivo
- created_at

Constraints:

- unique (draw_id, white_1..white_5, powerball, generator_version, inputs_fingerprint) // si draw_id existe
- si draw_id es null: unique (white_1..white_5, powerball, generator_version, inputs_fingerprint, generated_at::date)

### 2.8 ProfitLossByDraw

Resumen de inversión vs ganancia por sorteo.
Fields:

- id (uuid)
- draw_id (fk)
- total_investment (numeric)
- total_winnings (numeric)
- net (numeric) // computed o redundante
- computed_at (timestamptz)
- created_at

Constraints:

- unique(draw_id)

## 3. Derived / Analytics Tables (Optional v1)

Para v1 puedes calcular on-the-fly. Si se materializa:

- AnalysisRun (stores filters & snapshot of dataset)
- PositionalFrequencyResult
- CorrelationResult

## 4. Rules & Guardrails (Data)

- Histórico oficial: inmutable
- Played/Future: editable y borrable (con auditoría via ImportBatch)
- Toda entidad “importada” debe tener import_batch_id
- Idempotencia obligatoria:
  - Official sync: upsert por (draw_id)
  - Imports: detect por source_file_hash y unique constraints

## 5. Indexing (Minimum)

- Draw(game, draw_date)
- OfficialResult(draw_id)
- PlayedCombination(draw_id)
- QuickPickGenerated(draw_id, generated_at)
- ImportBatch(import_type, created_at)

## 6. Data Validation

- Normalizar white balls ascendente antes de guardar
- Rechazar:
  - fuera de rango
  - formatos incompletos
  - draw_date ausente

## 7. Change Management

Cambios a rangos/reglas (ej: powerball range) deben:

- introducir “rules_version”
- migrar validaciones
- mantener compatibilidad histórica
