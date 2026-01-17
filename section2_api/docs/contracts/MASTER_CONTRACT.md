# Powerball Analytics — MASTER CONTRACT (Final)

Version: v1.0
Owner: Dennys Guedez
Date: 2025-12-26
Status: FINAL (Signed)

## 1) Scope

### 1.1 Core (MVP)

- Sections: POWERBALL, FILE, ORGANIZE, DECOMPOSE, POSITIONAL FREQUENCY, POSITIONAL SUMMARY
- Next Draw Insights (Same Date / Previous / Future Offset)
- Date-Based Analysis (PB / Pos1 / Pos2-5)
- Smart Quick Picks Generator
- Legal-safe (no predictions)

### 1.2 Pro Extension (Roadmap / Powerball Pro)

- Notes per number (context_hash)
- Future manual combos + stats
- Neighbors tables (ranges 1–15..61–69)
- Positions modal (P1..P6 + summaries P2..P6)
- AI Insights panel (dataset-based)
- Auth (JWT roles)
- Docker compose
- Swagger-first workflow
- “One-sheet” rule (central work in one view)

## 2) Repository Structure (Canonical)

Root: `powerball_ai/`

- `powerball_api/` (FastAPI backend)
- `powerball_ui/` (React/Vite frontend)
  Rules:
- No breaking changes to core modules
- Historical official data is immutable

## 3) Naming (Conflict-safe)

- Table 2 (Designer) = Designer Sets
- Table 2 (Notes/Frequency) = Frequency & Notes Table
- Table 3 (Future) = Future Draws Table
- Tables 4–8 = Neighbors Tables
- Positions = Positions Modal

## 4) Non-Negotiables (Guardrails)

- Historical results immutable
- No prediction/guarantee language
- Contract naming is source of truth
- API stable only if documented in api_contract.md

## 5) Annexes (Part of this contract)

- Data model: `docs/data-model.md`
- Preflight checklist: `docs/preflight/preflight_checklist.md`
- API contract: `docs/api_contract.md` (to be finalized from live endpoints)
- Design system: `docs/contracts/design-system.md`
- Navigation & states: `docs/contracts/navigation-states.md`
- Guardrails: `docs/contracts/guardrails.md`

## 6) Change Requests

Anything not in this master contract is v1.1+ and must be a CR.

## 7) Signature

Owner: Dennys Guedez
Signed: YES
