from __future__ import annotations

from typing import List, Set, Tuple, Optional
from .data_access import Draw, fetch_last_draws
import sqlite3
from pathlib import Path

def _db_path() -> Path:
    # fallback: env var or default location used by data_access
    from .data_access import resolve_sqlite_path
    return Path(resolve_sqlite_path())

def fetch_draws_between(start_date: str, end_date: str) -> List[Draw]:
    """Inclusive range fetch, ascending by date."""
    db = _db_path()
    conn = sqlite3.connect(str(db))
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT draw_date, white1, white2, white3, white4, white5, powerball
            FROM draws
            WHERE draw_date >= ? AND draw_date <= ?
              AND white1 IS NOT NULL AND white2 IS NOT NULL AND white3 IS NOT NULL
              AND white4 IS NOT NULL AND white5 IS NOT NULL AND powerball IS NOT NULL
            ORDER BY draw_date ASC
            """,
            (start_date, end_date),
        )
        rows = cur.fetchall()
        return [Draw(str(r[0]), int(r[1]), int(r[2]), int(r[3]), int(r[4]), int(r[5]), int(r[6])) for r in rows]
    finally:
        conn.close()

def as_combo(draw: Draw) -> Tuple[Tuple[int,int,int,int,int], int]:
    whites = tuple(sorted([draw.white1, draw.white2, draw.white3, draw.white4, draw.white5]))
    return whites, int(draw.powerball)

def is_historical_combination(whites: List[int], powerball: int, lookback: int = 5000) -> bool:
    """Exact historical match check (full history via last draws with large n)."""
    # fetch_last_draws is DESC; use large lookback to approximate all
    draws = fetch_last_draws(lookback, until_date=None, require_complete=True)
    target = (tuple(sorted(int(x) for x in whites)), int(powerball))
    return any(as_combo(d) == target for d in draws)

def is_near_duplicate_of_recent(whites: List[int], powerball: int, lookback: int = 500,
                               overlap_whites_block: int = 4, overlap_whites_soft: int = 3) -> Optional[dict]:
    """Blocks near-duplicates:
    - overlap_whites >= overlap_whites_block with any recent draw
    - OR overlap_whites >= overlap_whites_soft AND same powerball
    Returns info dict if near-duplicate else None.
    """
    ws = set(int(x) for x in whites)
    pb = int(powerball)
    recent = fetch_last_draws(lookback, until_date=None, require_complete=True)
    best = None
    for d in recent:
        dw = {d.white1,d.white2,d.white3,d.white4,d.white5}
        overlap = len(ws.intersection(dw))
        same_pb = (pb == int(d.powerball))
        if overlap >= overlap_whites_block or (overlap >= overlap_whites_soft and same_pb):
            info = {"draw_date": d.draw_date, "overlap_whites": overlap, "same_powerball": same_pb,
                    "draw_whites": sorted(list(dw)), "draw_powerball": int(d.powerball)}
            # keep strongest overlap
            if best is None or info["overlap_whites"] > best["overlap_whites"]:
                best = info
    return best
