from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Tuple

router = APIRouter(prefix="/api/optimize", tags=["optimize"])

class Play(BaseModel):
    whites: List[int] = Field(..., min_items=5, max_items=5)
    powerball: int = Field(..., ge=1, le=26)
    score: float = 0.0
    rationale_tags: Optional[List[str]] = None
    why: Optional[List[str]] = None
    signals_used: Optional[Dict[str, Any]] = None

class OptimizeRequest(BaseModel):
    plays: List[Play]
    k: int = Field(default=10, ge=3, le=50)
    beta_overlap: float = Field(default=1.0, ge=0.0, le=10.0)
    alpha_new_numbers: float = Field(default=0.15, ge=0.0, le=3.0)

def _overlap(a: List[int], b: List[int]) -> int:
    return len(set(a).intersection(set(b)))

@router.post("/select")
def select(req: OptimizeRequest):
    pool = [p.model_dump() for p in req.plays]
    if not pool:
        return {"status":"error","message":"no_plays"}

    # normalize scores
    scores = [float(p.get("score",0.0)) for p in pool]
    mn, mx = min(scores), max(scores)
    def norm(x: float) -> float:
        return 0.5 if mx==mn else (x-mn)/(mx-mn)

    selected: List[Dict[str, Any]] = []
    used_nums = set()
    while pool and len(selected) < req.k:
        best = None
        best_val = -1e9
        for p in pool:
            sc = norm(float(p.get("score",0.0)))
            # overlap penalty
            ov = sum(_overlap(p["whites"], q["whites"]) for q in selected)
            # new number bonus (coverage)
            newc = len(set(p["whites"]).difference(used_nums))
            val = sc + req.alpha_new_numbers*newc - req.beta_overlap*ov
            if val > best_val:
                best_val = val
                best = p
        if best is None:
            break
        selected.append(best)
        used_nums.update(best["whites"])
        pool.remove(best)

    return {"status":"ok","k": len(selected), "selected": selected}
