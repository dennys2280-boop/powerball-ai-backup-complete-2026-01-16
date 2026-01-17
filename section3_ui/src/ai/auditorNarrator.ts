export function getPath(obj: any, path: string): any {
  const parts = path.split(".").filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function auditorLine(obj: any, label: string, path: string, formatter?: (v:any)=>string) {
  const v = getPath(obj, path);
  if (v === undefined) return `${label}: (no está en el JSON)`;
  return `${label}: ${formatter ? formatter(v) : String(v)}`;
}
