from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional

from .assistants import assistants_catalog
from .engine import run_engine
from .rescore import rescore_combo
from .data import is_near_duplicate_of_recent

router = APIRouter()


class Constraints(BaseModel):
    whites_min: int = Field(default=1, ge=1, le=69)
    whites_max: int = Field(default=69, ge=1, le=69)
    max_overlap_last_draw: Optional[int] = Field(default=None, ge=0, le=5, description="Máximo de blancas repetidas con el último sorteo.")
    pb_not_in_last_n: Optional[int] = Field(default=None, ge=1, le=200, description="El powerball no puede repetirse en los últimos N sorteos.")
    min_high_50: Optional[int] = Field(default=None, ge=0, le=5, description="Mínimo de blancas >=50.")
    min_low_20: Optional[int] = Field(default=None, ge=0, le=5, description="Mínimo de blancas <=20.")


class RunRequest(BaseModel):
    draw_date: Optional[str] = Field(default=None, description="YYYY-MM-DD. Si no se envía, usa la fecha de hoy.")
    windows: List[int] = Field(default_factory=lambda: [2, 5, 10, 15, 20], description="Ventanas de análisis.")
    n_suggestions: int = Field(default=10, ge=1, le=50, description="Cantidad de jugadas por asistente.")
    seed: Optional[int] = Field(default=None, description="Seed para reproducibilidad.")
    strict_mode: bool = Field(default=False, description="Bloquea combinaciones demasiado parecidas a recientes (anti-overlap).")
    similarity_level: int = Field(default=1, ge=0, le=3, description="0=OFF, 1=básico, 2=+bloqueo fuerte en últimas 10, 3=+PB no repetido en últimas 5.")
    recent_lookback: int = Field(default=50, ge=5, le=500, description="Cuántos sorteos recientes usar para anti-overlap.")
    overlap_block: int = Field(default=4, ge=3, le=5, description="Umbral de similitud: overlap blancas+PB (si PB coincide suma 1).")
    constraints: Optional[Constraints] = Field(default=None, description="Restricciones opcionales por voz/UI.")

    near_duplicate_block: bool = Field(default=True, description="Bloquea jugadas casi iguales a históricas recientes (V39).")
    near_dup_lookback: int = Field(default=500, ge=50, le=5000, description="Cuántos sorteos recientes considerar para V39.")
    near_dup_overlap_block: int = Field(default=4, ge=3, le=5, description="Bloquea si comparte >= N blancas con un histórico reciente.")
    near_dup_overlap_soft: int = Field(default=3, ge=2, le=5, description="Bloquea si comparte >= N blancas y además repite PB.")

    assistant_ids: Optional[List[str]] = Field(
        default=None,
        description="Si se envía, corre SOLO estos asistentes. Si no, corre todos.",
    )


@router.get("/assistants/catalog")
def catalog():
    return {"status": "ok", "assistants": assistants_catalog()}


@router.post("/assistants/run")
def run(req: RunRequest):
    out = run_engine(req)

    # V39 near-duplicate filter (post-proc): removes suggestions too similar to recent historical draws.
    if out.get("status") == "ok" and getattr(req, "near_duplicate_block", True):
        lookback = int(getattr(req, "near_dup_lookback", 500))
        ob = int(getattr(req, "near_dup_overlap_block", 4))
        osf = int(getattr(req, "near_dup_overlap_soft", 3))
        removed = 0
        by = out.get("results_by_assistant", {}) or {}
        for aid, obj in by.items():
            sugg = obj.get("suggestions", []) or []
            keep = []
            for s in sugg:
                info = is_near_duplicate_of_recent(s.get("whites", []), s.get("powerball", 0), lookback=lookback,
                                                   overlap_whites_block=ob, overlap_whites_soft=osf)
                if info:
                    removed += 1
                    # annotate for transparency
                    s["blocked_reason"] = {"type":"near_duplicate", **info}
                    continue
                keep.append(s)
            obj["suggestions"] = keep
        out.setdefault("meta", {}).setdefault("filters", {})["near_duplicate"] = {
            "enabled": True, "lookback": lookback, "overlap_block": ob, "overlap_soft": osf, "removed": removed
        }
    return out


class RescoreRequest(BaseModel):
    draw_date: Optional[str] = Field(default=None, description="YYYY-MM-DD. Si no se envía, usa la fecha de hoy.")
    windows: List[int] = Field(default_factory=lambda: [2, 5, 10, 15, 20])
    strict_mode: bool = Field(default=False, description="Bloquea combinaciones demasiado parecidas a recientes (anti-overlap).")
    similarity_level: int = Field(default=1, ge=0, le=3, description="0=OFF, 1=básico, 2=+bloqueo fuerte en últimas 10, 3=+PB no repetido en últimas 5.")
    recent_lookback: int = Field(default=50, ge=5, le=500, description="Cuántos sorteos recientes usar para anti-overlap.")
    overlap_block: int = Field(default=4, ge=3, le=5, description="Umbral de similitud: overlap blancas+PB (si PB coincide suma 1).")
    constraints: Optional[Constraints] = Field(default=None, description="Restricciones opcionales por voz/UI.")

    near_duplicate_block: bool = Field(default=True, description="Bloquea jugadas casi iguales a históricas recientes (V39).")
    near_dup_lookback: int = Field(default=500, ge=50, le=5000, description="Cuántos sorteos recientes considerar para V39.")
    near_dup_overlap_block: int = Field(default=4, ge=3, le=5, description="Bloquea si comparte >= N blancas con un histórico reciente.")
    near_dup_overlap_soft: int = Field(default=3, ge=2, le=5, description="Bloquea si comparte >= N blancas y además repite PB.")

    assistant_ids: Optional[List[str]] = Field(default=None)
    whites: List[int] = Field(..., min_items=5, max_items=5)
    powerball: int = Field(..., ge=1, le=26)


@router.post("/assistants/rescore")
def rescore(req: RescoreRequest):
    draw_date = req.draw_date
    if not draw_date:
        from datetime import date as _date
        draw_date = _date.today().isoformat()
    return rescore_combo(draw_date, req.windows, req.assistant_ids, req.whites, req.powerball)


@router.post('/consensus')
def consensus(req: RunRequest):
    return build_consensus(req)
