// src/lib/powerballApi.js

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  ""
);

/**
 * Remove null/undefined/empty-string params so URLSearchParams stays clean.
 */
function cleanParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Ensure path begins with "/" so we don't produce bad URLs.
 */
function normalizePath(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Build a URL from base + path + query params.
 */
export function buildUrl(path, params = {}) {
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

/**
 * Map scope+operator to backend endpoints.
 * scope: "history" | "future"
 * operator: "AND" | "OR" | "ATLEAST"
 */
export function getEndpoint(scope, operator) {
  const s = scope === "future" ? "future" : "history";
  const base = `/api/${s}/filter`;

  if (operator === "OR") return `${base}/or`;
  if (operator === "ATLEAST") return `${base}/atleast`;

  return base; // AND (default)
}

/**
 * Low-level fetch helper that gives better error messages for Safari/network.
 */
async function fetchJson(url, { signal } = {}) {
  let res;

  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (err) {
    const msg =
      err?.name === "AbortError"
        ? "Request aborted"
        : `Network error: ${err?.message || "Failed to fetch"} | URL: ${url}`;
    throw new Error(msg);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText} | URL: ${url}`);
  }

  const text = await res.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`API returned non-JSON response | URL: ${url}`);
  }
}

/**
 * Main function used by Table1.
 * Returns: { raw, data, count, url }
 */
export async function fetchTable1(scope, operator, params) {
  const endpoint = getEndpoint(scope, operator);
  const url = buildUrl(endpoint, params);

  const json = await fetchJson(url);

  const data = Array.isArray(json) ? json : json?.data || [];
  const count = typeof json?.count === "number" ? json.count : data.length;

  return { raw: json, data, count, url };
}

/**
 * Generic GET helper (optional).
 */
export async function apiGet(path, params = {}) {
  const url = buildUrl(path, params);
  const json = await fetchJson(url);
  return { raw: json, url };
}

/**
 * Future Draws (Pro placeholder)
 * Returns same envelope style as fetchTable1 to keep callers consistent.
 */
export async function fetchFutureDraws(params = {}) {
  const url = buildUrl("/api/future/filter", params);
  const json = await fetchJson(url);

  const data = Array.isArray(json) ? json : json?.data || [];
  const count = typeof json?.count === "number" ? json.count : data.length;

  return { raw: json, data, count, url };
}
