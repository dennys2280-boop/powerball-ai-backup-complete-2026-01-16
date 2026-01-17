from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from ..ai_assistants.engine import run_ai_assistants
from ..ai_assistants.data import fetch_draws_between

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    windows: List[int] = Field(default_factory=lambda: [10,20])
    assistant_ids: Optional[List[str]] = None
    n_suggestions: int = Field(default=15, ge=5, le=50)
    limit_dates: int = Field(default=30, ge=5, le=120)
    strict_mode: bool = True
    similarity_level: int = Field(default=2, ge=0, le=3)
    recent_lookback: int = 50
    overlap_block: int = 4
    constraints: Optional[dict] = None

def _overlap(a: List[int], b: List[int]) -> int:
    return len(set(a).intersection(set(b)))

def _internal_overlap(suggestions: List[Dict[str, Any]]) -> float:
    if len(suggestions) < 2: return 0.0
    total = 0; pairs = 0
    for i in range(len(suggestions)):
        for j in range(i+1, len(suggestions)):
            total += _overlap(suggestions[i]["whites"], suggestions[j]["whites"])
            pairs += 1
    return total / pairs if pairs else 0.0

@router.post("/run")
def run(req: BacktestRequest):
    draws = fetch_draws_between(req.start_date, req.end_date)
    dates = [d.draw_date for d in draws]
    if not dates:
        return {"status":"error","message":"no_draws_in_range"}
    dates = dates[-req.limit_dates:]
    agg: Dict[str, Dict[str, float]] = {}
    per_date = []
    for i, d in enumerate(dates):
        run_req = {
            "draw_date": d, "windows": req.windows, "assistant_ids": req.assistant_ids,
            "n_suggestions": req.n_suggestions, "seed": 1000 + i,
            "strict_mode": req.strict_mode, "similarity_level": req.similarity_level,
            "recent_lookback": req.recent_lookback, "overlap_block": req.overlap_block,
            "constraints": req.constraints,
        }
        out = run_ai_assistants(type("Obj",(object,),run_req)())
        by = out.get("results_by_assistant", {})
        row = {"date": d, "assistants": {}}
        for aid, obj in by.items():
            sug = obj.get("suggestions", [])
            avg_score = sum(float(s.get("score",0)) for s in sug)/len(sug) if sug else 0.0
            io = _internal_overlap(sug) if sug else 0.0
            row["assistants"][aid] = {"count": len(sug), "avg_score": avg_score, "internal_overlap": io}
            a = agg.setdefault(aid, {"dates":0.0,"avg_score":0.0,"internal_overlap":0.0,"count":0.0})
            a["dates"] += 1.0; a["avg_score"] += avg_score; a["internal_overlap"] += io; a["count"] += len(sug)
        per_date.append(row)
    summary = {aid: {"dates": int(v["dates"]), "avg_score": v["avg_score"]/max(1.0,v["dates"]),
                     "avg_internal_overlap": v["internal_overlap"]/max(1.0,v["dates"]),
                     "avg_suggestions": v["count"]/max(1.0,v["dates"])}
               for aid,v in agg.items()}
    return {"status":"ok","dates_tested":len(dates),"summary":summary,"per_date":per_date}
