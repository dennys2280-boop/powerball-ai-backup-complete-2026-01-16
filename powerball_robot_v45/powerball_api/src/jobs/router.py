from __future__ import annotations
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
from .registry import create_job, update_job, get_job
from ..ai_assistants.engine import run_ai_assistants

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class BulkRunRequest(BaseModel):
    draw_date: Optional[str] = None
    windows: List[int] = Field(default_factory=lambda: [2,5,10,15,20])
    assistant_ids: Optional[List[str]] = None
    n_suggestions: int = Field(default=100, ge=10, le=500)
    seed: Optional[int] = None
    strict_mode: bool = True
    similarity_level: int = Field(default=2, ge=0, le=3)
    recent_lookback: int = 50
    overlap_block: int = 4
    constraints: Optional[dict] = None

def _do(job_id: str, req: BulkRunRequest):
    try:
        update_job(job_id, status="running", progress=0.1)
        out = run_ai_assistants(req)
        update_job(job_id, status="done", progress=1.0, result=out)
    except Exception as e:
        update_job(job_id, status="error", progress=1.0, error=str(e))

@router.post("/start")
def start(req: BulkRunRequest, bg: BackgroundTasks):
    jid = create_job("bulk_run", req.model_dump())
    bg.add_task(_do, jid, req)
    return {"status":"ok","job_id":jid}

@router.get("/{job_id}")
def status(job_id: str):
    job = get_job(job_id)
    if not job:
        return {"status":"error","message":"job_not_found"}
    return {"status":"ok","job": {k: job[k] for k in ("id","kind","created_at","status","progress","result","error")}}
