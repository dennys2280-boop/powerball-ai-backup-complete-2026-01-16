# Powerball Analytics — MASTER CONTRACT (Final)

Version: v1.0
Owner: Dennys Guedez
Date: 2025-12-26
Status: FINAL (Signed)

## 1) Scope

### 1.1 Core Product (MVP)

- Section 1: POWERBALL (Overview Hub, Official Results, Played input, P&L)
- Section 2: FILE (Import/Export, immutable historical, editable played/future)
- Section 3: ORGANIZE (Table 1 read-only: filter/sort/count)
- Section 4: DECOMPOSE (Neighbors by ranges)
- Section 5: POSITIONAL FREQUENCY ANALYSIS (P1..P6)
- Section 6: POSITIONAL SUMMARY (P2..P6 mirrors)
- Next Draw Frequency Insights (Same Date / Previous Draw / Future Offset)
- Date-Based Analysis (Powerball / First Position / Positions 2–5)
- Smart Quick Picks Generator (legal-safe)

### 1.2 Pro Extension (Roadmap / Powerball Pro)

- Notes per number (context_hash-scoped)
- Future manual combos + draw_date + group stats
- Neighbors tables 4–8 as dedicated module (ranges)
- Positions modal (tabs P1..P6 + summary tables P2..P6)
- AI Insights (dataset-based, no predictions)
- Auth (JWT roles)
- Docker Compose
- Swagger-first methodology
- One-sheet rule (central work in one view)

## 2) Repository Structure (Canonical)

Root: `powerball_ai/`

- `powerball_api/` (FastAPI backend; entrypoint: `main.py`)
- `powerball_ui/` (frontend)

Contract rules:

- Core UI layout remains: 2-column desktop (Table 1 left; Designer Sets right)
- Modern Preview remains parallel; does not break core layout

## 3) Naming (Conflict-safe)

- Table 2 (Designer) = Designer Sets (existing)
- Table 2 (Frecuencias/Notas) = Frequency & Notes Table (Pro)
- Table 3 (Futuros/Manual) = Future Draws Table (Pro)
- Tables 4–8 = Neighbors Tables (Pro)
- Positions = Positions Modal (Pro)

## 4) Non-Negotiables (Guardrails)

- Historical official data is immutable
- No “prediction/guarantee” language
- Swagger-first: endpoint is “done” only with real Swagger example validated
- No large refactors before connecting UI
- Order: works + looks → then pro/clean

## 5) Annexes (Part of this contract)

- Data model: `powerball_api/docs/data-model.md`
- Preflight checklist: `powerball_api/docs/preflight/preflight_checklist.md`
- API contract: `powerball_api/docs/api_contract.md`
- Design system: `powerball_api/docs/contracts/design-system.md`
- Navigation & states: `powerball_api/docs/contracts/navigation-states.md`
- Guardrails: `powerball_api/docs/contracts/guardrails.md`

## 6) Change Requests

Anything outside this master contract is v1.1+ and must be handled as a CR.

## 7) Signature

Owner: Dennys Guedez
Signed: YES
