from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time, json
from pathlib import Path

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])
LOG_PATH = Path(__file__).resolve().parents[2] / "telemetry.log"

class TelemetryEvent(BaseModel):
    event: str = Field(..., min_length=1, max_length=80)
    ts: Optional[float] = None
    data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = Field(default=None, max_length=64)

@router.post("/event")
def post_event(evt: TelemetryEvent):
    payload = evt.model_dump()
    payload["ts"] = payload.get("ts") or time.time()
    try:
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass
    return {"status":"ok"}
