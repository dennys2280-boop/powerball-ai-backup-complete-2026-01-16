// src/lib/api.js

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  ""
);

function cleanParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(path, params = {}) {
  const p = cleanParams(params);
  const qs = new URLSearchParams();

  for (const [k, v] of Object.entries(p)) {
    if (Array.isArray(v)) {
      for (const item of v) qs.append(k, String(item));
    } else {
      qs.set(k, String(v));
    }
  }

  const q = qs.toString();
  const fullPath = normalizePath(path);
  return `${API_BASE}${fullPath}${q ? `?${q}` : ""}`;
}

async function apiFetch(path, params = {}) {
  const url = buildUrl(path, params);

  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new Error(
      `Network error: ${err?.message || "Failed to fetch"} | URL: ${url}`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText} | URL: ${url}`);
  }

  // Guard: algunos endpoints pueden responder vacío
  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON response | URL: ${url}`);
  }
}

/* =========================
   DASHBOARD
   ========================= */

export async function getDashboardSummary() {
  const [history, future] = await Promise.allSettled([
    apiFetch("/api/history/filter", {
      complete: 1,
      sort: "draw_date",
      direction: "desc",
      output: "json",
      limit: 1,
    }),
    apiFetch("/api/future/filter", {
      complete: 1,
      sort: "draw_date",
      direction: "desc",
      output: "json",
      limit: 1,
    }),
  ]);

  const historyJson = history.status === "fulfilled" ? history.value : null;
  const futureJson = future.status === "fulfilled" ? future.value : null;

  return {
    status: "ok",
    latestHistory: historyJson?.data?.[0] || null,
    latestFuture: futureJson?.data?.[0] || null,
  };
}

/* =========================
   HISTORY
   ========================= */

export async function getHistoryRows(params = {}) {
  const json = await apiFetch("/api/history/filter", {
    complete: 1,
    sort: "draw_date",
    direction: "desc",
    output: "json",
    limit: 200,
    ...params,
  });

  return json?.data || [];
}

/* =========================
   SETTINGS
   ========================= */

export async function getSettings() {
  return {
    status: "ok",
    theme: "light",
    language: "en",
  };
}

/* =========================
   COMPATIBILITY ALIASES
   (DO NOT REMOVE)
   ========================= */

export const fetchDashboardSummary = () => getDashboardSummary();
export const fetchHistoryRows = (params = {}) => getHistoryRows(params);
export const fetchSettings = () => getSettings();
