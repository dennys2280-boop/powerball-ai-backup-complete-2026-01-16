// src/lib/decomposeCorrelation.js

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIntPB(v) {
  const n = Number(v);
  // Powerball normalmente 1..26, pero si tu backend usa otro rango, ajusta aquí.
  if (!Number.isFinite(n)) return null;
  if (n < 1) return null;
  return n;
}

/**
 * Compat: tabla-id según número
 */
export function getTableIdForNumber(n) {
  if (n >= 1 && n <= 15) return 3;
  if (n >= 16 && n <= 30) return 4;
  if (n >= 31 && n <= 45) return 5;
  if (n >= 46 && n <= 60) return 6;
  if (n >= 61 && n <= 69) return 7;
  return null;
}

/**
 * Compat: rangos por table-id
 */
export function getRangeForTableId(tableId) {
  if (tableId === 3) return [1, 15];
  if (tableId === 4) return [16, 30];
  if (tableId === 5) return [31, 45];
  if (tableId === 6) return [46, 60];
  if (tableId === 7) return [61, 69];
  return null;
}

/**
 * Compat: lista pares desde un arreglo de conteos
 * (esto viene de tu versión previa; lo dejo intacto)
 */
export function listPairs(countArray, base, side, { limit = 25, minCount = 1 } = {}) {
  const pairs = [];
  for (let p = 1; p <= 69; p++) {
    const c = countArray?.[p] || 0;
    if (c < minCount) continue;
    if (side === "L" && p >= base) continue;
    if (side === "R" && p <= base) continue;
    pairs.push({ paired_number: p, count: c });
  }
  pairs.sort((a, b) => b.count - a.count || a.paired_number - b.paired_number);
  return pairs.slice(0, Math.max(0, limit)).map((x, idx) => ({ ...x, rank: idx + 1 }));
}

/**
 * NUEVO: para cada base, guardamos combos (L,R) con count.
 * Key: `${L}-${R}`
 *
 * value:
 *  { count: number, leftIsPB: boolean, rightIsPB: boolean }
 */
function incPair(map, L, R, { leftIsPB = false, rightIsPB = false } = {}) {
  const key = `${L}-${R}`;
  const cur = map.get(key);

  // Compat: si alguna vez existiera como number, lo convertimos
  if (typeof cur === "number") {
    map.set(key, { count: cur + 1, leftIsPB, rightIsPB });
    return;
  }

  if (!cur) {
    map.set(key, { count: 1, leftIsPB, rightIsPB });
    return;
  }

  map.set(key, {
    count: (cur.count || 0) + 1,
    leftIsPB: Boolean(cur.leftIsPB) || Boolean(leftIsPB),
    rightIsPB: Boolean(cur.rightIsPB) || Boolean(rightIsPB),
  });
}

function mapToPairsArray(map) {
  const out = [];
  for (const [key, value] of map.entries()) {
    const [lStr, rStr] = String(key).split("-");
    const left = Number(lStr);
    const right = Number(rStr);
    if (!Number.isFinite(left) || !Number.isFinite(right)) continue;

    if (typeof value === "number") {
      out.push({ left, right, count: value, leftIsPB: false, rightIsPB: false });
      continue;
    }

    const count = Number(value?.count ?? 0);
    if (!Number.isFinite(count)) continue;

    out.push({
      left,
      right,
      count,
      leftIsPB: Boolean(value?.leftIsPB),
      rightIsPB: Boolean(value?.rightIsPB),
    });
  }
  return out;
}

/**
 * viewA: asc por (left, right), luego count desc
 * viewB: desc por (left, right), luego count desc
 */
function buildViewsForBase(pairs, { minCount = 1, limit = 2500 } = {}) {
  const filtered = (pairs || []).filter((p) => (p?.count || 0) >= minCount);

  const viewA = [...filtered]
    .sort((a, b) => a.left - b.left || a.right - b.right || b.count - a.count)
    .slice(0, limit);

  const viewB = [...filtered]
    .sort((a, b) => b.left - a.left || b.right - a.right || b.count - a.count)
    .slice(0, limit);

  return {
    viewA: viewA.map((x) => ({
      left: x.left,
      right: x.right,
      count: x.count,
      leftIsPB: Boolean(x.leftIsPB),
      rightIsPB: Boolean(x.rightIsPB),
    })),
    viewB: viewB.map((x) => ({
      left: x.left,
      right: x.right,
      count: x.count,
      leftIsPB: Boolean(x.leftIsPB),
      rightIsPB: Boolean(x.rightIsPB),
    })),
  };
}

function buildTableForRange(pairCountsByBase, from, to) {
  const bases = [];
  let totalRows = 0;

  for (let base = from; base <= to; base++) {
    const map = pairCountsByBase.get(base) || new Map();
    const pairs = mapToPairsArray(map);
    const { viewA, viewB } = buildViewsForBase(pairs, { minCount: 1, limit: 2500 });
    totalRows += (viewA?.length || 0) + (viewB?.length || 0);
    bases.push({ base, viewA, viewB });
  }

  return { bases, totalRows };
}

/**
 * SECTION 4 — DECOMPOSE (CORREGIDO SEGÚN TU REGLA)
 *
 * ✅ Regla EXACTA:
 * - Dentro de los 5 blancos ordenados:
 *   Para cada base N:
 *     L = vecino inmediato menor (si existe)
 *     R = vecino inmediato mayor (si existe)
 * - EXCEPCIÓN:
 *   Para el último blanco (máximo), su R = Powerball (PB) y se marca rightIsPB=true
 *
 * Esto elimina el “cross product” y evita correlaciones falsas.
 */
export function buildDecomposeCorrelation(draws) {
  // counts legacy: counts[base].L[paired], counts[base].R[paired]
  const counts = Array.from({ length: 70 }, () => ({
    L: Array(70).fill(0),
    R: Array(70).fill(0),
  }));

  // pairCountsByBase.get(base) => Map("L-R" -> {count, rightIsPB})
  const pairCountsByBase = new Map();

  let cutoffDate = null;

  for (const r of draws || []) {
    const numsRaw = [r?.white1, r?.white2, r?.white3, r?.white4, r?.white5]
      .map(toInt)
      .filter((n) => n !== null);

    if (numsRaw.length !== 5) continue;

    // combinación ordenada asc
    const nums = numsRaw.slice().sort((a, b) => a - b);

    const pb = toIntPB(r?.powerball); // puede ser null si no viene o es inválido

    const dd = String(r?.draw_date ?? "").trim();
    if (dd) cutoffDate = cutoffDate ? (dd > cutoffDate ? dd : cutoffDate) : dd;

    // ✅ vecino inmediato por cada base
    for (let i = 0; i < 5; i++) {
      const base = nums[i];
      if (base < 1 || base > 69) continue;

      const leftNeighbor = i > 0 ? nums[i - 1] : null;

      // R vecino inmediato mayor, excepto último blanco => R = PB
      const isLastWhite = i === 4;
      const rightNeighbor = !isLastWhite ? nums[i + 1] : pb;

      // Si no hay L, no se genera par (no existe correlación L-R para esa base)
      if (leftNeighbor === null) continue;

      // Si no hay R, tampoco hay par
      if (rightNeighbor === null) continue;

      // legacy counts
      if (leftNeighbor >= 1 && leftNeighbor <= 69) counts[base].L[leftNeighbor] += 1;

      // right puede ser blanco 1..69 o PB 1..26 (o rango que uses)
      // counts legacy R solo tenía 1..69, pero lo dejamos registrar si está en rango 1..69
      if (rightNeighbor >= 1 && rightNeighbor <= 69) counts[base].R[rightNeighbor] += 1;

      // nuevo: guardar el par (L,R) para la tabla
      let map = pairCountsByBase.get(base);
      if (!map) {
        map = new Map();
        pairCountsByBase.set(base, map);
      }

      incPair(map, leftNeighbor, rightNeighbor, {
        leftIsPB: false,
        rightIsPB: Boolean(isLastWhite), // ✅ solo el último blanco apunta a PB como R
      });
    }
  }

  // tablas por rango (bases 1..69)
  const t3 = buildTableForRange(pairCountsByBase, 1, 15);
  const t4 = buildTableForRange(pairCountsByBase, 16, 30);
  const t5 = buildTableForRange(pairCountsByBase, 31, 45);
  const t6 = buildTableForRange(pairCountsByBase, 46, 60);
  const t7 = buildTableForRange(pairCountsByBase, 61, 69);

  const totalRows =
    (t3.totalRows || 0) +
    (t4.totalRows || 0) +
    (t5.totalRows || 0) +
    (t6.totalRows || 0) +
    (t7.totalRows || 0);

  return {
    counts,
    cutoffDate,
    totalRows,
    table3: t3.bases,
    table4: t4.bases,
    table5: t5.bases,
    table6: t6.bases,
    table7: t7.bases,
  };
}
