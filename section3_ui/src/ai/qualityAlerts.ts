export type QualityAlert = { level: "info" | "warn"; text: string };

export function analyzePlay(whites: number[], powerball: number): QualityAlert[] {
  const alerts: QualityAlert[] = [];
  const w = [...whites].sort((a,b)=>a-b);

  let consec = 0;
  for (let i=1;i<w.length;i++) if (w[i]===w[i-1]+1) consec++;
  if (consec>=2) alerts.push({level:"warn", text:"Muchos consecutivos (patrón raro)."});

  const m5 = w.filter(n=>n%5===0).length;
  if (m5>=3) alerts.push({level:"warn", text:"3+ múltiplos de 5 (patrón concentrado)."});

  const sum = w.reduce((s,n)=>s+n,0);
  if (sum<90 || sum>220) alerts.push({level:"info", text:`Suma inusual (${sum}).`});

  const tens = w.map(n=>Math.floor(n/10));
  const maxBin = Math.max(...tens.map(t=>tens.filter(x=>x===t).length));
  if (maxBin>=4) alerts.push({level:"warn", text:"Concentración por decenas (4+ en la misma decena)."});

  const odd = w.filter(n=>n%2===1).length;
  if (odd===0 || odd===5) alerts.push({level:"info", text:"Todos pares o todos impares (poco común)."});

  if (powerball<=2 || powerball>=25) alerts.push({level:"info", text:"Powerball en extremo (muy bajo/alto)."});

  return alerts;
}
