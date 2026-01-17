import React, { useMemo, useState } from "react";
import { track } from "../ai/telemetryClient";

export default function ConstraintBuilder({ form, setForm }: any) {
  const [avoidConsec, setAvoidConsec] = useState(true);
  const [maxM5, setMaxM5] = useState(2);
  const [minHigh, setMinHigh] = useState(1);
  const [highFrom, setHighFrom] = useState(40);

  const constraints = useMemo(() => {
    return {
      avoid_consecutives: avoidConsec,
      max_multiples_of_5: maxM5,
      min_high_numbers: minHigh,
      high_from: highFrom,
    };
  }, [avoidConsec, maxM5, minHigh, highFrom]);

  function apply() {
    setForm({ ...form, constraints: { ...(form.constraints || {}), ...constraints } });
    track("constraint_builder_apply", constraints);
  }

  return (
    <div style={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12 }}>
      <h3>Constraint Builder (V38)</h3>
      <label style={row()}>
        <input type="checkbox" checked={avoidConsec} onChange={(e) => setAvoidConsec(e.target.checked)} />
        <span>Evitar demasiados consecutivos</span>
      </label>

      <label style={row()}>
        <span>Máx múltiplos de 5</span>
        <input type="number" value={maxM5} min={0} max={5} onChange={(e) => setMaxM5(parseInt(e.target.value || "0"))} style={num()} />
      </label>

      <label style={row()}>
        <span>Mín # altos (≥ high_from)</span>
        <input type="number" value={minHigh} min={0} max={5} onChange={(e) => setMinHigh(parseInt(e.target.value || "0"))} style={num()} />
      </label>

      <label style={row()}>
        <span>high_from</span>
        <input type="number" value={highFrom} min={1} max={69} onChange={(e) => setHighFrom(parseInt(e.target.value || "1"))} style={num()} />
      </label>

      <button onClick={apply} style={btn()}>Aplicar constraints</button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{JSON.stringify(constraints, null, 2)}</pre>
    </div>
  );
}

function row(){return {display:"flex",gap:10,alignItems:"center",marginTop:8} as any;}
function num(){return {width:90,padding:8,borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",background:"#111827",color:"#e2e8f0"} as any;}
function btn(){return {marginTop:10,padding:10,borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"#1f2937",color:"white",cursor:"pointer"} as any;}
