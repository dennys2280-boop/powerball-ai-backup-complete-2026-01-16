// src/lib/section5PositionalFrequency.js

/**
 * SECTION 5 — Positional Frequency Analysis
 *
 * Contract:
 * - Source: FilteredRows (Table 1 filtered dataset).
 * - Per row:
 *   - Whites [white1..white5] sorted ascending => P1..P5
 *   - P6 = powerball
 * - Stages (combos by position):
 *   - Pos1: [P1 P2 P3 P4 P5 P6]
 *   - Pos2: [P2 P3 P4 P5 P6]
 *   - Pos3: [P3 P4 P5 P6]
 *   - Pos4: [P4 P5 P6]
 *   - Pos5: [P5 P6]
 *   - Pos6: [P6]
 * - For each Position k table:
 *   - Excel Index: 1..69 (fixed, immovable; no sorting)
 *   - Number: 1..69
 *   - Count: frequency of the FIRST element of the stage combo
 *   - Filtered Combinations: evidence list for that number (stage combos), kept ascending
 */

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeRowToP(row) {
  const whitesRaw = [
    row?.white1,
    row?.white2,
    row?.white3,
    row?.white4,
    row?.white5,
  ];

  const whites = whitesRaw
    .map(toNum)
    .filter((n) => n !== null)
    .slice(0, 5)
    .sort((a, b) => a - b);

  if (whites.length !== 5) return null;

  const pb = toNum(row?.powerball);
  if (pb === null) return null;

  return { P: [whites[0], whites[1], whites[2], whites[3], whites[4], pb] };
}

export function buildStageCombos(P, positionIndex1to6) {
  const start = Math.max(0, Math.min(5, Number(positionIndex1to6) - 1));
  return P.slice(start);
}

export function computePositionTable(rows, positionIndex1to6) {
  const counts = new Array(70).fill(0); // 0 unused
  const evidence = Array.from({ length: 70 }, () => []);

  for (const r of rows || []) {
    const norm = normalizeRowToP(r);
    if (!norm) continue;

    const stage = buildStageCombos(norm.P, positionIndex1to6);
    if (!stage || stage.length === 0) continue;

    const head = stage[0];
    if (!Number.isFinite(head) || head < 1 || head > 69) continue;

    counts[head] += 1;
    evidence[head].push(stage);
  }

  // Evidence combos must be ascending by the first element of the stage (constant per bucket),
  // then by remaining elements to keep deterministic ordering.
  for (let n = 1; n <= 69; n += 1) {
    evidence[n].sort((a, b) => {
      for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
        const av = a[i] ?? -Infinity;
        const bv = b[i] ?? -Infinity;
        if (av !== bv) return av - bv;
      }
      return 0;
    });
  }

  const data = [];
  for (let n = 1; n <= 69; n += 1) {
    data.push({
      excelIndex: n,
      number: n,
      count: counts[n] || 0,
      combinations: evidence[n] || [],
    });
  }

  return data;
}

export function computeSection5Tables(filteredRows) {
  const rows = Array.isArray(filteredRows) ? filteredRows : [];
  return {
    pos1: computePositionTable(rows, 1),
    pos2: computePositionTable(rows, 2),
    pos3: computePositionTable(rows, 3),
    pos4: computePositionTable(rows, 4),
    pos5: computePositionTable(rows, 5),
    pos6: computePositionTable(rows, 6),
  };
}
