# Powerball Analytics — Technical Pre-Flight Checklist (48h)

Owner: **\*\*\*\***\_\_\_\_**\*\*\*\*** Date: **\*\*\*\***\_\_\_\_**\*\*\*\***

## A. Contract Freeze (Day 1 AM)

- [ ] A1. Contrato funcional v1.0 disponible en repo (docs/contracts/functional-contract.md)
- [ ] A2. Design system tokens documentados (docs/contracts/design-system.md)
- [ ] A3. Navigation + States documentado (docs/contracts/navigation-states.md)
- [ ] A4. Guardrails (“NO HACER”) documentados (docs/contracts/guardrails.md)
- [ ] A5. Definición “naming canónico” ES/EN fijada (docs/contracts/naming.md)

Acceptance:

- [ ] Todo el equipo puede localizar los docs en <30s
- [ ] No hay decisiones abiertas (“TODO” críticos)

## B. Data Model Freeze (Day 1 PM)

- [ ] B1. Se definieron entidades: Draw, HistoricalResult, PlayedTicket, PlayedCombination, QuickPickGenerated, ImportBatch
- [ ] B2. Regla inmutable: histórico oficial NO editable
- [ ] B3. Todas las importaciones requieren fecha + fuente + batch_id
- [ ] B4. Timezone definida (UTC en DB; UI con TZ local)
- [ ] B5. Unique constraints definidas (evitar duplicados)
- [ ] B6. Idempotencia definida para sync oficial y re-imports

Acceptance:

- [ ] Existe db/schema_v1.sql o migration inicial
- [ ] Existe docs/data-model.md completo
- [ ] Se probaron 3 casos: import duplicado, date faltante, formato inválido

## C. Critical Integrations Smoke Test (Day 2 AM)

- [ ] C1. Fetch “Official Results” (últimos 10) funciona (mock + real)
- [ ] C2. Fetch Jackpot & Cash Value funciona (mock + real)
- [ ] C3. Excel import (played combinations) parsea 1 archivo real
- [ ] C4. Manual entry crea records válidos
- [ ] C5. Ticket photo OCR (POC) produce output usable (aunque sea parcial)
- [ ] C6. Error handling: offline / rate-limit / HTML change

Acceptance:

- [ ] Logs claros (sin leaks de datos sensibles)
- [ ] Fallos muestran error humano + retry

## D. App Skeleton & State (Day 2 PM)

- [ ] D1. Rutas de todas las secciones existen (aunque vacías)
- [ ] D2. Sidebar (desktop) y BottomNav (mobile) funcionando
- [ ] D3. CTA “Generate Smart Quick Picks” visible siempre
- [ ] D4. Empty/Loading/Error states en 3 pantallas clave
- [ ] D5. Persistencia mínima de estado (filters/config) al navegar

Acceptance:

- [ ] Cambiar secciones NO resetea estado accidentalmente
- [ ] UI responde en mobile (no overflow, tap targets OK)

## E. Quality Gates (Antes de Sprint 2)

- [ ] E1. Lint + typecheck en CI
- [ ] E2. Tests mínimos para parsers/import
- [ ] E3. Seed data mínimo para dev
- [ ] E4. Definition of Done acordada

FINAL GO/NO-GO:

- [ ] GO: Sprint 2 puede iniciar
- [ ] NO-GO: bloquear y corregir riesgos listados

Notes:

---

---
