from __future__ import annotations

from dataclasses import asdict
from datetime import date
from typing import Any, Dict

from .assistants import RunParams, assistants_catalog, build_context, run_all_assistants


def _today_iso() -> str:
    return date.today().isoformat()


def run_engine(req: Any) -> Dict[str, Any]:
    draw_date = getattr(req, "draw_date", None) or _today_iso()
    windows = list(getattr(req, "windows", [2, 5, 10, 15, 20]))
    n_suggestions = int(getattr(req, "n_suggestions", 10))
    seed = getattr(req, "seed", None)
    strict_mode = bool(getattr(req, "strict_mode", False))
    similarity_level = int(getattr(req, "similarity_level", 1))
    recent_lookback = int(getattr(req, "recent_lookback", 50))
    overlap_block = int(getattr(req, "overlap_block", 4))
    constraints = getattr(req, "constraints", None)
    assistant_ids = getattr(req, "assistant_ids", None)

    params = RunParams(
        draw_date=draw_date,
        windows=windows,
        n_suggestions=n_suggestions,
        seed=seed,
        strict_mode=strict_mode,
        recent_lookback=recent_lookback,
        overlap_block=overlap_block,
        similarity_level=similarity_level,
        constraints=constraints,
        assistant_ids=assistant_ids,
    )

    ctx = build_context(params)
    if not ctx.last_draws_desc:
        return {
            "status": "error",
            "error": "NO_DATA",
            "message": "No hay draws completos disponibles para analizar.",
            "meta": {"draw_date": draw_date},
        }

    last_draw = ctx.last_draws_desc[0]
    results = run_all_assistants(ctx, params)

    return {
        "status": "ok",
        "meta": {
            "draw_date": draw_date,
            "windows": windows,
            "n_suggestions": n_suggestions,
            "seed": seed,
            "legal_note": "Salida basada en análisis histórico/heurístico. No es predicción ni garantía.",
            "hard_rule": "Ninguna sugerencia coincide con ninguna combinación del histórico (bloqueo total).",
            "anti_overlap": {
                "enabled": strict_mode,
                "recent_lookback": recent_lookback,
                "overlap_block": overlap_block,
                "level": similarity_level,
            },
        },
        "catalog": assistants_catalog(),
        "last_draw_used": asdict(last_draw),
        "analysis": {
            "by_window": ctx.by_window,
            "same_month_day_count": len(ctx.same_mmdd),
            "same_weekday_count": len(ctx.same_weekday),
            "shape_reference": ctx.shape_ref,
        },
        "results_by_assistant": results,
    }
