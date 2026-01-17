from __future__ import annotations
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .rate_limit import allow

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_per_minute: float = 180.0, burst: float = 90.0):
        super().__init__(app)
        self.rate_per_minute = rate_per_minute
        self.burst = burst

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host if request.client else "unknown"
        if not allow(ip, self.rate_per_minute, self.burst):
            return JSONResponse({"status":"error","message":"rate_limited"}, status_code=429)
        return await call_next(request)
