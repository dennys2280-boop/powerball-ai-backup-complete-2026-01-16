// src/hooks/useDecompose.js
import { useMemo } from "react";

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Reglas:
// - Solo Ball 1..5
// - Si no hay vecino: 0
function extractTriplesFromRow(row) {
  const b = [
    toInt(row?.white1),
    toInt(row?.white2),
    toInt(row?.white3),
    toInt(row?.white4),
    toInt(row?.white5),
  ];

  // si algo viene null, igual lo tratamos como null (se ignora esa posición)
  const out = [];
  for (let i = 0; i < 5; i++) {
    const base = b[i];
    if (base === null) continue;

    const left = i > 0 ? (b[i - 1] ?? 0) : 0;
    const right = i < 4 ? (b[i + 1] ?? 0) : 0;

    out.push({ base, left: left ?? 0, right: right ?? 0 });
  }
  return out;
}

function keyOf(t) {
  return `${t.left}|${t.base}|${t.right}`;
}

function parseKey(k) {
  const [l, b, r] = String(k).split("|").map((x) => Number(x));
  return { left: l, base: b, right: r };
}

function sortA(a, b) {
  // Vista A: orden creciente por Left, luego Right, luego Count desc (opcional)
  if (a.left !== b.left) return a.left - b.left;
  if (a.right !== b.right) return a.right - b.right;
  // empate: mayor count primero
  return (b.count || 0) - (a.count || 0);
}

function sortB(a, b) {
  // Vista B: Count DESC, luego Left ASC, Right ASC
  if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
  if (a.left !== b.left) return a.left - b.left;
  return a.right - b.right;
}

function buildForBase(base, map) {
  const items = [];
  for (const [k, count] of map.entries()) {
    const p = parseKey(k);
    if (p.base !== base) continue;
    items.push({ ...p, count });
  }

  const viewA = [...items].sort(sortA);
  const viewB = [...items].sort(sortB);

  return { viewA, viewB };
}

function buildRange(start, end, baseMap) {
  const bases = [];
  for (let n = start; n <= end; n++) {
    bases.push({
      base: n,
      ...buildForBase(n, baseMap),
    });
  }
  return bases;
}

export function useDecompose(rows) {
  return useMemo(() => {
    const safeRows = Array.isArray(rows) ? rows : [];

    // Map global: key "L|B|R" -> count
    const freq = new Map();

    for (const row of safeRows) {
      const triples = extractTriplesFromRow(row);
      for (const t of triples) {
        // solo base 1..69
        if (!t.base || t.base < 1 || t.base > 69) continue;
        const k = keyOf(t);
        freq.set(k, (freq.get(k) || 0) + 1);
      }
    }

    return {
      totalRows: safeRows.length,

      // Tablas 3–7
      table3: buildRange(1, 15, freq),
      table4: buildRange(16, 30, freq),
      table5: buildRange(31, 45, freq), // aquí PB=45 se pinta rojo
      table6: buildRange(46, 60, freq),
      table7: buildRange(61, 69, freq),
    };
  }, [rows]);
}
