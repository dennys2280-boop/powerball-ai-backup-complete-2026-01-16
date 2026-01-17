const KEY = "powerball_telemetry_buffer_v1";

export function track(event: string, data?: any) {
  try {
    const buf = load();
    buf.unshift({ event, data, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(buf.slice(0, 200)));
  } catch {}

  fetch("http://localhost:8000/api/telemetry/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data, ts: Date.now() / 1000 }),
  }).catch(() => {});
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
