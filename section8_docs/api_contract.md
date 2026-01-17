# Powerball Analytics — API CONTRACT (v1.0)

Source of truth: `powerball_api/main.py`  
Style rule: Swagger-first (endpoint “done” only with a real example tested in Swagger)  
Legal rule: No prediction/guarantee semantics

---

## 0) Global

### Base URLs (dev)

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

### Canonical API Prefix (Swagger source of truth)

All functional endpoints are under: `/api/*`

### Canonical Endpoint List (OpenAPI snapshot)

This list must match `/openapi.json` (do not invent routes):

- GET `/`
- GET `/api/export/first-position`
- GET `/api/export/first-position.xlsx`
- GET `/api/history/by-position`
- GET `/api/history/filter`
- GET `/api/history/filter/or`
- GET `/api/history/filter/atleast`
- POST `/api/future/quickpick`
- GET `/api/future/filter`
- GET `/api/future/filter/or`
- GET `/api/future/filter/atleast`
- POST `/api/future/import-excel`
- POST `/api/future/quickpick/unique`

### CORS Allowed Origins

- http://localhost:5174
- http://127.0.0.1:5174
- http://localhost:5173
- http://127.0.0.1:5173

### Response formats

Some endpoints support:

- `output=json` (default)
- `output=lines` (returns line-based output when implemented in `src`)

### Limits

- History endpoints default `limit=5000`
- Future filter default `limit=200`
- Future quickpick generation max:
  - `/api/future/quickpick`: `n<=500`
  - `/api/future/quickpick/unique`: `n<=100`

### Swagger-first “DONE” rule

An endpoint is considered DONE only when:

1. It is visible in Swagger `/docs`
2. It has been executed via “Try it out”
3. A real request + real response (or file behavior) is pasted in this contract under “✅ Real example (from Swagger)”

---

BLOQUE CORREGIDO (PÉGALO TAL CUAL)

## 1) Health

### GET /

**Purpose:** Health check.  
**Response (200):**

```json
{ "status": "ok" }


✅ Real example (from Swagger / curl)

Request:

GET /


Response (200):

{
  "status": "ok"
}

2) EXPORT — First Position Frequency
GET /api/export/first-position

Purpose: Frequency summary of the first white ball (white1/ball1) from historical draws.

Query params:

limit (int, optional) — 1..69, default 69

source (str, optional) — default auto

auto = DATABASE_URL → SQLite → CSV

Response (200):
Success returns {status:"ok", source, total_draws, data:[{number,count,pct}], meta}
On no data, returns {status:"error", error:"NO_DATA", ...} (as implemented)

✅ Real example (from Swagger / curl)

Request:

GET /api/export/first-position?limit=10&source=auto


Response (200):

{
  "status": "ok",
  "source": "sqlite:/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db",
  "total_draws": 2869,
  "data": [
    { "number": 1, "count": 261, "pct": 9.0972 },
    { "number": 2, "count": 243, "pct": 8.4699 },
    { "number": 3, "count": 212, "pct": 7.3893 },
    { "number": 5, "count": 207, "pct": 7.2151 },
    { "number": 4, "count": 197, "pct": 6.8665 },
    { "number": 6, "count": 174, "pct": 6.0648 },
    { "number": 7, "count": 159, "pct": 5.542 },
    { "number": 8, "count": 149, "pct": 5.1934 },
    { "number": 9, "count": 137, "pct": 4.7752 },
    { "number": 10, "count": 122, "pct": 4.2524 }
  ],
  "meta": {
    "limit": 10,
    "note": "Frecuencia del primer número blanco (white1/ball1)."
  }
}

GET /api/export/first-position.xlsx

Purpose: Export the First Position Frequency as XLSX.

Query params:

limit (int, optional) — 1..69, default 69

source (str, optional) — default auto

Response (200): Returns an XLSX file.

✅ Real example (file behavior)

Request:

GET /api/export/first-position.xlsx?limit=69&source=auto


Observed behavior (curl download):

curl -L "http://localhost:8000/api/export/first-position.xlsx?limit=69&source=auto" \
  -o /Users/dennysg/Documents/powerball_ai/powerball_api/first_position.xlsx

ls -lh /Users/dennysg/Documents/powerball_ai/powerball_api/first_position.xlsx
open /Users/dennysg/Documents/powerball_ai/powerball_api/first_position.xlsx


Observed output:

File created at: /Users/dennysg/Documents/powerball_ai/powerball_api/first_position.xlsx

Size observed: 6.3K

3) HISTORY (Draws) — Read-only
GET /api/history/by-position

Purpose: List historical draws where a number appears in a specific white position.

Query params:

pos (int, required) — position index (expected 1..5)

num (int, required) — number to search

limit (int, optional) — default 5000

Response (200):
{ status:"ok", position, number, count, data:[{draw_date,white1..white5,powerball}], meta }

✅ Real example (from Swagger / curl)

Request:

GET /api/history/by-position?pos=1&num=10&limit=5


Response (200):

{
  "status": "ok",
  "position": 1,
  "number": 10,
  "count": 5,
  "data": [
    {
      "draw_date": "1992-07-01",
      "white1": 10,
      "white2": 24,
      "white3": 31,
      "white4": 33,
      "white5": 45,
      "powerball": 30
    },
    {
      "draw_date": "1992-08-01",
      "white1": 10,
      "white2": 15,
      "white3": 17,
      "white4": 20,
      "white5": 28,
      "powerball": 29
    },
    {
      "draw_date": "1992-09-12",
      "white1": 10,
      "white2": 20,
      "white3": 22,
      "white4": 26,
      "white5": 34,
      "powerball": 35
    },
    {
      "draw_date": "1992-11-25",
      "white1": 10,
      "white2": 12,
      "white3": 14,
      "white4": 20,
      "white5": 26,
      "powerball": 35
    },
    {
      "draw_date": "1993-02-20",
      "white1": 10,
      "white2": 28,
      "white3": 32,
      "white4": 38,
      "white5": 41,
      "powerball": 38
    }
  ],
  "meta": {
    "limit": 5,
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db"
  }
}

GET /api/history/filter (AND)

Purpose: AND-filter across historical draws (supports date range, sorting, output mode).

Query params (all optional unless noted):

white1..white5 (int|null)

powerball (int|null)

date_from (str|null) — YYYY-MM-DD

date_to (str|null) — YYYY-MM-DD

complete (int) — default 1

sort (str) — default draw_date

direction (str) — default asc

output (str) — default json

limit (int) — default 5000

Response (200):

If output=json: { status:"ok", count, filters, data:[...], meta }

If output=lines: { status:"ok", count, filters, lines:[...], meta }

✅ Real example (from Swagger / curl)

Request:

GET /api/history/filter?complete=1&sort=draw_date&direction=asc&output=json&limit=3


Response (200):

{
  "status": "ok",
  "count": 3,
  "filters": {
    "white1": null,
    "white2": null,
    "white3": null,
    "white4": null,
    "white5": null,
    "powerball": null,
    "date_from": null,
    "date_to": null,
    "complete": true,
    "sort": "draw_date",
    "direction": "asc",
    "output": "json"
  },
  "meta": {
    "limit": 3,
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db"
  },
  "data": [
    {
      "draw_date": "1992-04-22",
      "white1": 2,
      "white2": 25,
      "white3": 35,
      "white4": 41,
      "white5": 42,
      "powerball": 15
    },
    {
      "draw_date": "1992-04-25",
      "white1": 6,
      "white2": 9,
      "white3": 22,
      "white4": 42,
      "white5": 44,
      "powerball": 12
    },
    {
      "draw_date": "1992-04-29",
      "white1": 1,
      "white2": 8,
      "white3": 10,
      "white4": 28,
      "white5": 35,
      "powerball": 10
    }
  ]
}

GET /api/history/filter/or (OR)

Purpose: OR-filter across historical draws (any of the provided conditions).
Swagger default shows output=lines.

✅ Real example (from Swagger / curl)

Request:

GET /api/history/filter/or?white1=10&white3=5&output=lines&limit=10


Response (200):

{
  "status": "ok",
  "count": 10,
  "mode": "or",
  "filters": {
    "white1": 10,
    "white2": null,
    "white3": 5,
    "white4": null,
    "white5": null,
    "powerball": null,
    "date_from": null,
    "date_to": null,
    "complete": true,
    "sort": "draw_date",
    "direction": "asc",
    "output": "lines"
  },
  "meta": {
    "limit": 10,
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db"
  },
  "lines": [
    "1992-07-01 | 10-24-31-33-45 PB:30",
    "1992-08-01 | 10-15-17-20-28 PB:29",
    "1992-09-12 | 10-20-22-26-34 PB:35",
    "1992-11-25 | 10-12-14-20-26 PB:35",
    "1993-02-20 | 10-28-32-38-41 PB:38",
    "1993-05-12 | 10-24-35-36-39 PB:13",
    "1993-06-05 | 1-3-5-9-30 PB:45",
    "1993-08-14 | 10-11-14-34-36 PB:10",
    "1993-10-20 | 10-13-27-34-35 PB:22",
    "1994-09-10 | 10-11-20-27-44 PB:26"
  ]
}


✅ Real example (smoke, no filters)

Request:

GET /api/history/filter/or?output=lines&limit=10


Response (200):

{
  "status": "ok",
  "count": 10,
  "mode": "or",
  "filters": {
    "white1": null,
    "white2": null,
    "white3": null,
    "white4": null,
    "white5": null,
    "powerball": null,
    "date_from": null,
    "date_to": null,
    "complete": true,
    "sort": "draw_date",
    "direction": "asc",
    "output": "lines"
  },
  "meta": {
    "limit": 10,
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db"
  },
  "lines": [
    "1992-04-22 | 2-25-35-41-42 PB:15",
    "1992-04-25 | 6-9-22-42-44 PB:12",
    "1992-04-29 | 1-8-10-28-35 PB:10",
    "1992-05-02 | 14-23-31-32-41 PB:33",
    "1992-05-06 | 27-29-30-36-43 PB:4",
    "1992-05-09 | 1-12-16-23-31 PB:33",
    "1992-05-13 | 3-6-13-33-43 PB:37",
    "1992-05-16 | 2-9-19-28-30 PB:38",
    "1992-05-20 | 3-11-16-30-34 PB:45",
    "1992-05-23 | 23-27-28-36-44 PB:26"
  ]
}

GET /api/history/filter/atleast (ATLEAST)

Purpose: Returns historical draws where at least min_match of the provided conditions match.

Query params:

white1..white5 (int|null)

powerball (int|null)

min_match (int) — default 2

date_from (str|null)

date_to (str|null)

complete (int) — default 1

sort (str) — default score

direction (str) — default desc

output (str) — default lines (supports json)

limit (int) — default 5000

✅ Real example (from Swagger / curl)

Request:

GET /api/history/filter/atleast?white1=10&white3=5&powerball=7&min_match=2&sort=score&direction=desc&output=json&limit=5


Response (200):

{
  "status": "ok",
  "count": 3,
  "mode": "atleast",
  "filters": {
    "white1": 10,
    "white2": null,
    "white3": 5,
    "white4": null,
    "white5": null,
    "powerball": 7,
    "min_match": 2,
    "date_from": null,
    "date_to": null,
    "complete": true,
    "sort": "score",
    "direction": "desc",
    "output": "json"
  },
  "meta": {
    "limit": 5,
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db"
  },
  "data": [
    {
      "draw_date": "2017-10-07",
      "white1": 10,
      "white2": 49,
      "white3": 61,
      "white4": 63,
      "white5": 65,
      "powerball": 7,
      "score": 2
    },
    {
      "draw_date": "2013-01-12",
      "white1": 10,
      "white2": 14,
      "white3": 21,
      "white4": 23,
      "white5": 47,
      "powerball": 7,
      "score": 2
    },
    {
      "draw_date": "1997-12-20",
      "white1": 10,
      "white2": 11,
      "white3": 12,
      "white4": 17,
      "white5": 23,
      "powerball": 7,
      "score": 2
    }
  ]
}

4) FUTURE (Editable)
POST /api/future/quickpick

Purpose: Generate N future quickpicks and insert into future_draws (dedup by UNIQUE).

Query params (Swagger):

n (int, optional) — 1..500, default 1

draw_date (str|null, optional) — YYYY-MM-DD

seed (int|null, optional)

✅ Real example (from Swagger / curl)

Request:

POST /api/future/quickpick?n=3&draw_date=2026-01-03&seed=123


Response (200):

{
  "status": "ok",
  "requested": 3,
  "inserted": 0,
  "skipped_duplicates": 3,
  "data": []
}

GET /api/future/filter (AND)

Purpose: AND-filter across future_draws.

Query params:

white1..white5 (int|null)

powerball (int|null)

date_from (str|null)

date_to (str|null)

complete (int) — default 0

output (str) — default json

sort (str) — default created_at

direction (str) — default desc

limit (int) — default 200

✅ Real example (from Swagger / curl)

Request:

GET /api/future/filter?limit=5&direction=desc&output=json


Response (200):

{
  "status": "ok",
  "count": 5,
  "data": [
    {
      "id": 42391,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 25,
      "white3": 26,
      "white4": 36,
      "white5": 47,
      "powerball": 17,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42392,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 25,
      "white3": 26,
      "white4": 42,
      "white5": 45,
      "powerball": 5,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42393,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 25,
      "white3": 27,
      "white4": 37,
      "white5": 68,
      "powerball": 19,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42394,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 25,
      "white3": 31,
      "white4": 59,
      "white5": 61,
      "powerball": 26,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42395,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 25,
      "white3": 36,
      "white4": 39,
      "white5": 41,
      "powerball": 22,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    }
  ]
}

GET /api/future/filter/or (OR)

Purpose: OR-filter across future_draws (any condition matches).
Query params: same shape as /api/future/filter.

✅ Real example (from Swagger / curl)

Request:

GET /api/future/filter/or?white1=10&powerball=7&limit=5&output=json


Response (200):

{
  "status": "ok",
  "count": 5,
  "data": [
    {
      "id": 42427,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 28,
      "white3": 53,
      "white4": 57,
      "white5": 67,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42444,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 32,
      "white3": 40,
      "white4": 54,
      "white5": 64,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42478,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 40,
      "white3": 42,
      "white4": 64,
      "white5": 68,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42490,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 43,
      "white3": 54,
      "white4": 62,
      "white5": 65,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    },
    {
      "id": 42494,
      "draw_date": "2025-12-23",
      "white1": 9,
      "white2": 46,
      "white3": 55,
      "white4": 59,
      "white5": 61,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:48",
      "meta": "{\"source\": \"excel\"}"
    }
  ]
}

GET /api/future/filter/atleast (ATLEAST)

Purpose: ATLEAST filtering across future_draws, using computed score.

Query params:

white1..white5 (int|null)

powerball (int|null)

min_match (int) — default 2

complete (int) — default 0

output (str) — default json

sort (str) — default score

direction (str) — default desc

limit (int) — default 200

✅ Real example (from Swagger / curl)

Request:

GET /api/future/filter/atleast?white1=10&white3=5&powerball=7&min_match=2&limit=5&output=json


Response (200):

{
  "status": "ok",
  "count": 5,
  "data": [
    {
      "id": 98,
      "draw_date": null,
      "white1": 10,
      "white2": 26,
      "white3": 27,
      "white4": 53,
      "white5": 69,
      "powerball": 7,
      "created_at": "2025-12-23 09:59:51",
      "meta": "{\"source\": \"quickpick_unique\", \"constraints\": {\"white1\": null, \"white2\": null, \"white3\": null, \"white4\": null, \"white5\": null, \"powerball\": null}}",
      "score": 2
    },
    {
      "id": 114,
      "draw_date": null,
      "white1": 10,
      "white2": 25,
      "white3": 48,
      "white4": 53,
      "white5": 58,
      "powerball": 7,
      "created_at": "2025-12-23 09:59:51",
      "meta": "{\"source\": \"quickpick_unique\", \"constraints\": {\"white1\": null, \"white2\": null, \"white3\": null, \"white4\": null, \"white5\": null, \"powerball\": null}}",
      "score": 2
    },
    {
      "id": 348,
      "draw_date": null,
      "white1": 10,
      "white2": 15,
      "white3": 30,
      "white4": 44,
      "white5": 63,
      "powerball": 7,
      "created_at": "2025-12-23 13:57:25",
      "meta": "{\"source\": \"quickpick_unique\", \"constraints\": {\"white1\": null, \"white2\": null, \"white3\": null, \"white4\": null, \"white5\": null, \"powerball\": null}}",
      "score": 2
    },
    {
      "id": 436,
      "draw_date": null,
      "white1": 10,
      "white2": 11,
      "white3": 32,
      "white4": 50,
      "white5": 62,
      "powerball": 7,
      "created_at": "2025-12-23 13:57:25",
      "meta": "{\"source\": \"quickpick_unique\", \"constraints\": {\"white1\": null, \"white2\": null, \"white3\": null, \"white4\": null, \"white5\": null, \"powerball\": null}}",
      "score": 2
    },
    {
      "id": 966,
      "draw_date": "2025-12-23",
      "white1": 10,
      "white2": 12,
      "white3": 27,
      "white4": 52,
      "white5": 58,
      "powerball": 7,
      "created_at": "2025-12-23 15:43:40",
      "meta": "{\"source\": \"excel\"}",
      "score": 2
    }
  ]
}

POST /api/future/import-excel (multipart)

Purpose: Import official-format Excel into future_draws.

Request:

multipart/form-data

field: file (required)

query param: sheet_name (str|null, optional)

Response (200):
{ status:"ok", inserted, skipped_exists_in_history, skipped_duplicates_future, invalid_rows, errors_preview, meta }
Missing columns returns {status:"error", error:"MISSING_COLUMNS", ...} (implementation-level)

✅ Real example (from Swagger / curl)

Request:

POST /api/future/import-excel (multipart)
file: powerball_final.xlsx


Response (200):

{
  "status": "ok",
  "inserted": 2,
  "skipped_exists_in_history": 0,
  "skipped_duplicates_future": 0,
  "invalid_rows": 0,
  "errors_preview": [],
  "meta": {
    "db": "/Users/dennysg/Documents/powerball_ai/powerball_api/data/powerball.db",
    "detected_format": {
      "date_col": null,
      "whites_cols": ["n1", "n2", "n3", "n4", "n5"],
      "powerball_col": "powerball"
    }
  }
}

POST /api/future/quickpick/unique (constraints)

Purpose: Generate quickpicks unique across historical + future, optionally constrained by positions.

Query params (Swagger):

n (int, optional) — 1..100, default 1

draw_date (str|null, optional)

seed (int|null, optional)

white1..white5 (int|null, optional)

powerball (int|null, optional)

Response (200):
{ status:"ok", requested, inserted, attempts, exhausted, data:[...] } (implementation-level)
If constraints invalid: {status:"error", error:"...", ...} (implementation-level)

✅ Real example (from Swagger / curl)

Request:

POST /api/future/quickpick/unique?n=3&seed=1&white1=3&powerball=9


Response (200):

{
  "status": "ok",
  "requested": 3,
  "inserted": 3,
  "attempts": 8,
  "exhausted": false,
  "data": [
    {
      "draw_date": null,
      "white1": 3,
      "white2": 26,
      "white3": 40,
      "white4": 56,
      "white5": 66,
      "powerball": 9
    },
    {
      "draw_date": null,
      "white1": 3,
      "white2": 6,
      "white3": 33,
      "white4": 53,
      "white5": 63,
      "powerball": 9
    },
    {
      "draw_date": null,
      "white1": 3,
      "white2": 13,
      "white3": 15,
      "white4": 58,
      "white5": 67,
      "powerball": 9
    }
  ]
}


✅ Status: POST /api/future/quickpick/unique → DONE


---
```
