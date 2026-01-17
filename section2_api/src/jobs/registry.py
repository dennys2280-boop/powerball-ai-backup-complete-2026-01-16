from __future__ import annotations
import time, uuid
from typing import Dict, Any, Optional

_JOBS: Dict[str, Dict[str, Any]] = {}

def create_job(kind: str, payload: dict) -> str:
    jid = uuid.uuid4().hex
    _JOBS[jid] = {
        "id": jid, "kind": kind, "created_at": time.time(),
        "status": "queued", "progress": 0.0,
        "payload": payload, "result": None, "error": None,
    }
    return jid

def update_job(jid: str, **kwargs):
    if jid in _JOBS:
        _JOBS[jid].update(kwargs)

def get_job(jid: str) -> Optional[Dict[str, Any]]:
    return _JOBS.get(jid)
