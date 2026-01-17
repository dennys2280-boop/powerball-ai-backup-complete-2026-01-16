from __future__ import annotations
from typing import Dict, Any, List, Tuple
import random
from .engine import run_ai_assistants
from .data import is_historical_combination

def _vote(results_by_assistant: Dict[str, Any]) -> Tuple[Dict[int,float], Dict[int,float]]:
    vw: Dict[int,float] = {}
    vpb: Dict[int,float] = {}
    for _, obj in results_by_assistant.items():
        for s in obj.get("suggestions", []):
            for n in s.get("whites", []):
                vw[int(n)] = vw.get(int(n), 0.0) + 1.0
            pb = int(s.get("powerball"))
            vpb[pb] = vpb.get(pb, 0.0) + 1.0
    return vw, vpb

def _wchoice(items: List[int], weights: List[float]) -> int:
    total = sum(weights) or 1.0
    r = random.random() * total
    upto = 0.0
    for x, w in zip(items, weights):
        upto += w
        if upto >= r:
            return x
    return items[-1]

def build_consensus(req_obj) -> Dict[str, Any]:
    out = run_ai_assistants(req_obj)
    if out.get("status") != "ok":
        return out

    vw, vpb = _vote(out.get("results_by_assistant", {}))
    if not vw:
        return {"status":"error","message":"no_votes"}

    items = sorted(vw.items(), key=lambda kv: kv[1], reverse=True)[:40]
    nums = [k for k,_ in items]
    wts = [v for _,v in items]

    whites: List[int] = []
    while len(whites) < 5 and len(nums) >= 5:
        n = _wchoice(nums, wts)
        if n not in whites:
            whites.append(n)
        i = nums.index(n)
        wts[i] = max(0.1, wts[i] * 0.25)

    whites = sorted(whites)
    pb_items = sorted(vpb.items(), key=lambda kv: kv[1], reverse=True)[:20]
    pb = _wchoice([k for k,_ in pb_items], [v for _,v in pb_items]) if pb_items else random.randint(1,26)

    if is_historical_combination(whites, pb):
        for _ in range(80):
            cand = whites.copy()
            cand[random.randrange(0,5)] = random.randint(1,69)
            cand = sorted(set(cand))
            if len(cand) != 5:
                continue
            if not is_historical_combination(cand, pb):
                whites = cand
                break

    out["consensus"] = {
        "whites": whites,
        "powerball": pb,
        "rationale_tags": ["consensus","vote_ensemble"],
        "why": [
            "Ensamble por votación de números sugeridos por varios asistentes.",
            "Ajusta pesos para evitar repetir demasiadas blancas."
        ],
        "signals_used": {"vote_pool_whites": len(vw), "vote_pool_pb": len(vpb)},
        "score": 0.0
    }
    return out
