// src/lib/suggestions.js

function clampInt(n, lo, hi) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const i = Math.trunc(x);
  if (i < lo || i > hi) return null;
  return i;
}

function keyCombo(w, pb) {
  return `${w.join("-")}|${pb}`;
}

function buildWeightsFromCounts(counts, min, max) {
  // counts: Map<number, count>
  // return array of { n, w } with smoothing
  const out = [];
  for (let n = min; n <= max; n++) {
    const c = counts.get(n) || 0;
    // smoothing para que nunca sea 0:
    const w = 1 + c;
    out.push({ n, w });
  }
  return out;
}

function weightedPick(items, rnd) {
  let sum = 0;
  for (const it of items) sum += it.w;
  if (sum <= 0) return items[Math.floor(rnd() * items.length)]?.n ?? null;

  let r = rnd() * sum;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.n;
  }
  return items[items.length - 1]?.n ?? null;
}

// PRNG estable (para que no “parpadee” demasiado)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromRows(rows) {
  // seed simple por contenido (estable para un mismo filtrado)
  const s = JSON.stringify(
    (rows || []).slice(0, 50).map((r) => [
      r?.draw_date,
      r?.white1,
      r?.white2,
      r?.white3,
      r?.white4,
      r?.white5,
      r?.powerball,
    ])
  );
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateSuggestionsFromRows(rows, { count = 25 } = {}) {
  const data = Array.isArray(rows) ? rows : [];
  if (!data.length) return [];

  // Frequency by position
  const posCounts = [new Map(), new Map(), new Map(), new Map(), new Map()];
  const pbCounts = new Map();

  // PB-conditional counts (pb -> map(whiteNum -> count))
  const pbToWhiteCounts = new Map();

  for (const r of data) {
    const w = [
      clampInt(r?.white1, 1, 69),
      clampInt(r?.white2, 1, 69),
      clampInt(r?.white3, 1, 69),
      clampInt(r?.white4, 1, 69),
      clampInt(r?.white5, 1, 69),
    ];
    const pb = clampInt(r?.powerball, 1, 26);

    for (let i = 0; i < 5; i++) {
      const n = w[i];
      if (n == null) continue;
      posCounts[i].set(n, (posCounts[i].get(n) || 0) + 1);
    }

    if (pb != null) {
      pbCounts.set(pb, (pbCounts.get(pb) || 0) + 1);
      if (!pbToWhiteCounts.has(pb)) pbToWhiteCounts.set(pb, new Map());
      const m = pbToWhiteCounts.get(pb);
      for (const n of w) {
        if (n == null) continue;
        m.set(n, (m.get(n) || 0) + 1);
      }
    }
  }

  // weights
  const posWeights = posCounts.map((m) => buildWeightsFromCounts(m, 1, 69));
  const pbWeights = buildWeightsFromCounts(pbCounts, 1, 26);

  const seed = seedFromRows(data);
  const rnd = mulberry32(seed);

  const suggestions = [];
  const used = new Set();

  // Helper to sample a valid white set (unique whites)
  function sampleWhitesWithBias(pb) {
    const whites = [];
    const seen = new Set();

    // If we have pb-conditional distribution, add light bias
    const cond = pb != null ? pbToWhiteCounts.get(pb) : null;
    const condWeights = cond ? buildWeightsFromCounts(cond, 1, 69) : null;

    for (let i = 0; i < 5; i++) {
      let tries = 0;
      while (tries++ < 200) {
        const pickBase = weightedPick(posWeights[i], rnd);
        const pickCond = condWeights ? weightedPick(condWeights, rnd) : null;

        // Mix: 70% pos, 30% pb-conditional
        let pick = pickBase;
        if (pickCond != null && rnd() < 0.30) pick = pickCond;

        if (pick == null) continue;
        if (seen.has(pick)) continue;

        seen.add(pick);
        whites.push(pick);
        break;
      }
    }

    // If we failed to get 5, fill with random unique
    let tries = 0;
    while (whites.length < 5 && tries++ < 500) {
      const n = 1 + Math.floor(rnd() * 69);
      if (seen.has(n)) continue;
      seen.add(n);
      whites.push(n);
    }

    whites.sort((a, b) => a - b);
    return whites;
  }

  // Generate
  let guard = 0;
  while (suggestions.length < count && guard++ < count * 200) {
    const pb = weightedPick(pbWeights, rnd);
    const whites = sampleWhitesWithBias(pb);
    if (!whites.length || pb == null) continue;

    const k = keyCombo(whites, pb);
    if (used.has(k)) continue;
    used.add(k);

    suggestions.push({
      id: `s-${suggestions.length + 1}`,
      white1: whites[0],
      white2: whites[1],
      white3: whites[2],
      white4: whites[3],
      white5: whites[4],
      powerball: pb,
      note: "Suggested from filtered frequency (client-side).",
    });
  }

  return suggestions.slice(0, count);
}
