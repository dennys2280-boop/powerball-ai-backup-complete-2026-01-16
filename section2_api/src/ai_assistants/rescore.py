from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from .assistants import (
    RunParams,
    build_context,
    whites_key,
    combo_key,
    shape_metrics,
    normalize,
    merge,
    exponential_recency_weights,
    pb_recency_weights,
    window_freq,
    transition_matrix,
    _score,
    _compute_signal_scores,
    _explain_combo,
    WHITE_MIN,
    WHITE_MAX,
    PB_MIN,
    PB_MAX,
)
from collections import Counter


@dataclass
class RescoreRequest:
    draw_date: str
    windows: List[int]
    assistant_ids: Optional[List[str]]
    whites: List[int]
    powerball: int


def _build_models(ctx, params: RunParams):
    """
    Reproduce the same weight construction logic as run_all_assistants,
    but return per-assistant (weights_w, weights_pb, tags, signals_w, signals_pb).
    """
    max_w = max(params.windows) if params.windows else 20
    wref = ctx.by_window.get(max_w, {})
    freq_counts = (wref.get("frequency", {}) or {}).get("counts_whites", {})
    pb_counts = (wref.get("frequency", {}) or {}).get("counts_powerball", {})

    base_w = {n: float(freq_counts.get(n, 0)) + 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
    base_pb = {n: float(pb_counts.get(n, 0)) + 1.0 for n in range(PB_MIN, PB_MAX + 1)}

    # date
    if ctx.same_mmdd:
        f = window_freq(ctx.same_mmdd)
        date_w = {n: float(f["counts_whites"].get(n, 0)) + 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
        date_pb = {n: float(f["counts_powerball"].get(n, 0)) + 1.0 for n in range(PB_MIN, PB_MAX + 1)}
    else:
        date_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
        date_pb = {n: 1.0 for n in range(PB_MIN, PB_MAX + 1)}

    if ctx.same_weekday:
        fw = window_freq(ctx.same_weekday)
        wd_w = {n: float(fw["counts_whites"].get(n, 0)) + 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
        wd_pb = {n: float(fw["counts_powerball"].get(n, 0)) + 1.0 for n in range(PB_MIN, PB_MAX + 1)}
    else:
        wd_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
        wd_pb = {n: 1.0 for n in range(PB_MIN, PB_MAX + 1)}

    # positional (soft)
    pos_counts = (wref.get("positional", {}) or {}).get("counts_by_position", {}) or {}
    pos_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
    for _, cnts in pos_counts.items():
        for k, c in cnts.items():
            pos_w[int(k)] += float(c) * 0.25

    # markov empirical from last draw
    last = ctx.last_draws_desc[0]
    markov_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
    last_set = set(last.whites)
    for y in last_set:
        denom = max(1, int(ctx.prev_count.get(int(y), 0)))
        for x, c in ctx.trans.get(int(y), Counter()).items():
            markov_w[int(x)] += (float(c) / float(denom)) * 10.0

    # momentum
    last5 = ctx.last_draws_desc[:5]
    last20 = ctx.last_draws_desc[:20]
    c5 = Counter([n for d in last5 for n in d.whites])
    c20 = Counter([n for d in last20 for n in d.whites])
    momentum_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
    for n in range(WHITE_MIN, WHITE_MAX + 1):
        expected = (c20.get(n, 0) * (5.0 / 20.0))
        delta = c5.get(n, 0) - expected
        if delta > 0:
            momentum_w[n] += float(delta) * 2.0

    # overdue
    gaps = (wref.get("gaps", {}) or {}).get("white_gaps", {}) or {}
    overdue_w = {n: 1.0 + (float(gaps.get(n, 0)) * 0.15) for n in range(WHITE_MIN, WHITE_MAX + 1)}

    # recency
    rec_w = exponential_recency_weights(ctx.last_draws_desc, half_life=6.0)
    rec_pb = pb_recency_weights(ctx.last_draws_desc, half_life=6.0)

    # pb weights
    pbw_base = merge(base_pb, rec_pb)
    pbw_date = merge(base_pb, date_pb, wd_pb, rec_pb)

    models: Dict[str, Dict[str, Any]] = {}

    models["hot_cold_statistician"] = dict(
        weights_w=merge(base_w, rec_w, overdue_w),
        weights_pb=pbw_base,
        rationale_tags=["hot", "cold", "recency", "overdue", "shape_filter"],
        signals_w={"base_freq": base_w, "recency": rec_w, "overdue": overdue_w},
        signals_pb={"base_freq": base_pb, "recency": rec_pb},
    )

    models["sequence_hunter"] = dict(
        weights_w=merge(base_w, markov_w, momentum_w, rec_w),
        weights_pb=pbw_base,
        rationale_tags=["continuity", "active_chains", "markov_empirical", "momentum", "shape_filter"],
        signals_w={"base_freq": base_w, "markov": markov_w, "momentum": momentum_w, "recency": rec_w},
        signals_pb={"base_freq": base_pb, "recency": rec_pb},
    )

    models["positional_tactician"] = dict(
        weights_w=merge(pos_w, base_w),
        weights_pb=pbw_base,
        rationale_tags=["positional", "slot_sampling", "shape_filter"],
        signals_w={"positional": merge(pos_w, base_w)},
        signals_pb={"base_freq": base_pb, "recency": rec_pb},
    )

    models["date_historian"] = dict(
        weights_w=merge(base_w, date_w, wd_w, rec_w),
        weights_pb=pbw_date,
        rationale_tags=["same_mmdd", "same_weekday", "seasonality", "shape_filter"],
        signals_w={"base_freq": base_w, "same_mmdd": date_w, "same_weekday": wd_w, "recency": rec_w},
        signals_pb={"base_freq": base_pb, "same_mmdd": date_pb, "same_weekday": wd_pb, "recency": rec_pb},
    )

    uniform_w = {n: 1.0 for n in range(WHITE_MIN, WHITE_MAX + 1)}
    uniform_pb = {n: 1.0 for n in range(PB_MIN, PB_MAX + 1)}
    models["probability_purist"] = dict(
        weights_w=uniform_w,
        weights_pb=uniform_pb,
        rationale_tags=["monte_carlo", "acceptance_filter", "neutral"],
        signals_w={"uniform": uniform_w},
        signals_pb={"uniform": uniform_pb},
    )

    models["diversity_optimizer"] = dict(
        weights_w=merge(base_w, rec_w, date_w, wd_w, pos_w, markov_w, momentum_w, overdue_w),
        weights_pb=pbw_date,
        rationale_tags=["pool_then_select", "max_diversity", "blend_signals", "shape_filter"],
        signals_w={
            "base_freq": base_w,
            "recency": rec_w,
            "same_mmdd": date_w,
            "same_weekday": wd_w,
            "positional": pos_w,
            "markov": markov_w,
            "momentum": momentum_w,
            "overdue": overdue_w,
        },
        signals_pb={"base_freq": base_pb, "recency": rec_pb, "same_mmdd": date_pb, "same_weekday": wd_pb},
    )

    return models


def rescore_combo(draw_date: str, windows: List[int], assistant_ids: Optional[List[str]], whites: List[int], powerball: int) -> Dict[str, Any]:
    # Normalize whites
    ws = whites_key(whites)
    pb = int(powerball)

    if any((n < WHITE_MIN or n > WHITE_MAX) for n in ws) or pb < PB_MIN or pb > PB_MAX:
        return {"status": "error", "error": "OUT_OF_RANGE", "message": "Números fuera de rango."}
    if len(set(ws)) != 5:
        return {"status": "error", "error": "DUPLICATE_WHITE", "message": "Las blancas deben ser únicas."}

    params = RunParams(draw_date=draw_date, windows=windows, n_suggestions=10, seed=None, assistant_ids=assistant_ids)
    ctx = build_context(params)

    k = combo_key(ws, pb)
    is_historical = k in ctx.historical_keys

    models = _build_models(ctx, params)
    ids = assistant_ids or list(models.keys())

    by_assistant: Dict[str, Any] = {}
    for aid in ids:
        m = models.get(aid)
        if not m:
            continue
        w = normalize(m["weights_w"])
        p = normalize(m["weights_pb"])
        score = _score(ws, pb, w, p)
        sig = _compute_signal_scores(ws, pb, m.get("signals_w", {}), m.get("signals_pb", {}))
        why = _explain_combo(ctx, ws, pb, aid, m.get("rationale_tags", []), sig, window_for_explain=10)
        by_assistant[aid] = {
            "score": score,
            "signals_used": {k: round(float(v), 4) for k, v in sig.items()},
            "why": why,
            "rationale_tags": m.get("rationale_tags", []),
        }

    return {
        "status": "ok",
        "input": {"whites": list(ws), "powerball": pb},
        "valid": (not is_historical),
        "is_historical": is_historical,
        "rescore_by_assistant": by_assistant,
    }
