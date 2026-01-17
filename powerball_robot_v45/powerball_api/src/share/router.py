from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
import time, uuid

router = APIRouter(prefix="/api/share", tags=["share"])

# Dev/prototype store (memory). For production, persist in DB.
_STORE: Dict[str, Dict[str, Any]] = {}

class ShareCreateRequest(BaseModel):
    payload: Dict[str, Any]
    note: Optional[str] = Field(default=None, max_length=140)

@router.post("/create")
def create(req: ShareCreateRequest):
    sid = uuid.uuid4().hex[:10]
    _STORE[sid] = {"id": sid, "created_at": time.time(), "note": req.note, "payload": req.payload}
    return {"status":"ok","share_id": sid}

@router.get("/{share_id}")
def get_share(share_id: str):
    obj = _STORE.get(share_id)
    if not obj:
        return {"status":"error","message":"not_found"}
    return {"status":"ok","share": obj}
