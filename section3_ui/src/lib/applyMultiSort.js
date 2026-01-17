// src/lib/applyMultiSort.js

function parseDateValue(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

export default function applyMultiSort(rows, sorts) {
  const arr = [...(Array.isArray(rows) ? rows : [])];
  const safeSorts = Array.isArray(sorts) ? sorts : [];
  if (safeSorts.length === 0) return arr;

  const cmp = (a, b, col, dir) => {
    const av = a?.[col];
    const bv = b?.[col];

    if (col === "draw_date") {
      const at = parseDateValue(av) ?? 0;
      const bt = parseDateValue(bv) ?? 0;
      return dir === "desc" ? bt - at : at - bt;
    }

    const an = Number(av);
    const bn = Number(bv);
    const bothNums = Number.isFinite(an) && Number.isFinite(bn);
    if (bothNums) return dir === "desc" ? bn - an : an - bn;

    const as = String(av ?? "");
    const bs = String(bv ?? "");
    return dir === "desc" ? bs.localeCompare(as) : as.localeCompare(bs);
  };

  arr.sort((a, b) => {
    for (const s of safeSorts) {
      const d = cmp(a, b, s?.column, s?.direction);
      if (d !== 0) return d;
    }
    return 0;
  });

  return arr;
}
