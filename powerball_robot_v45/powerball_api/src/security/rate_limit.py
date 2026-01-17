from __future__ import annotations
import time
from typing import Dict, Tuple

_BUCKETS: Dict[str, Tuple[float, float]] = {}

def allow(ip: str, rate_per_minute: float = 120.0, burst: float = 60.0) -> bool:
    now = time.time()
    tokens, last = _BUCKETS.get(ip, (burst, now))
    refill = (now - last) * (rate_per_minute / 60.0)
    tokens = min(burst, tokens + refill)
    if tokens < 1.0:
        _BUCKETS[ip] = (tokens, now)
        return False
    _BUCKETS[ip] = (tokens - 1.0, now)
    return True
