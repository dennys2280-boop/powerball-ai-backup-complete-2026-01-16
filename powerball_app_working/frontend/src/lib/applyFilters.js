// src/lib/applyFilters.js

function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDateValue(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function applyRule(row, rule) {
  const col = rule?.column;
  const raw = row?.[col];

  // Date rule
  if (rule?.ruleType === "date") {
    const t = parseDateValue(raw);
    const a = parseDateValue(rule?.v1);
    const b = parseDateValue(rule?.v2);

    if (t === null) return false;

    if (rule?.op === "before") return a !== null ? t < a : true;
    if (rule?.op === "after") return a !== null ? t > a : true;

    if (rule?.op === "between") {
      if (a === null || b === null) return true;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return t >= lo && t <= hi;
    }

    return true;
  }

  // Number rule
  if (rule?.ruleType === "number") {
    const n = Number(raw);
    const a = toIntOrNull(rule?.v1);
    const b = toIntOrNull(rule?.v2);

    if (!Number.isFinite(n)) return false;

    if (rule?.op === "equals") return a !== null ? n === a : true;
    if (rule?.op === "greater") return a !== null ? n > a : true;
    if (rule?.op === "less") return a !== null ? n < a : true;

    if (rule?.op === "between") {
      if (a === null || b === null) return true;
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return n >= lo && n <= hi;
    }

    return true;
  }

  // Cell/text rule
  const s = String(raw ?? "");
  const q = String(rule?.v1 ?? "");

  if (rule?.op === "contains") return q ? s.toLowerCase().includes(q.toLowerCase()) : true;
  if (rule?.op === "equals") return q ? s.toLowerCase() === q.toLowerCase() : true;

  return true;
}

export default function applyFilters(rows, filterRules, matchMode) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeRules = Array.isArray(filterRules) ? filterRules : [];
  if (safeRules.length === 0) return safeRows;

  const mode = matchMode === "any" ? "any" : "all";

  return safeRows.filter((row) => {
    if (mode === "all") return safeRules.every((r) => applyRule(row, r));
    return safeRules.some((r) => applyRule(row, r));
  });
}
