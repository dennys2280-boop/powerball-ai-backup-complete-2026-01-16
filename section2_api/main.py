from __future__ import annotations

from fastapi import FastAPI, Query, UploadFile, File, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from typing import Optional
import os
import tempfile
import traceback

from src.export_first_position import (
    export_by_first_position,              # JSON
    export_first_position_xlsx,            # XLSX
    list_draws_by_position,
    list_draws_filtered,
    list_draws_filtered_or,
    list_draws_filtered_atleast,
    create_future_quickpicks,
    create_future_quickpicks_unique,
    list_future_filtered,
    list_future_filtered_or,
    list_future_filtered_atleast,
    import_future_from_excel,
)

app = FastAPI(title="Powerball API")

# -------------------------
# CORS
# -------------------------
origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe_error_payload(
    error_code: str,
    message: str,
    detail: str | None = None,
    extra: dict | None = None,
):
    """
    Contract-friendly error response:
    - Always JSON (never plain text)
    """
    payload = {
        "status": "error",
        "error": error_code,
        "message": message,
    }
    if detail:
        payload["detail"] = detail
    if extra:
        payload.update(extra)
    return payload


# -------------------------
# Global exception handlers
# (upgrade: NEVER return plain-text 500)
# -------------------------
@app.exception_handler(RequestValidationError)
async def _validation_exception_handler(request: Request, exc: RequestValidationError):
    # Keep HTTP 422, but normalize shape for Swagger-first stability
    return JSONResponse(
        status_code=422,
        content=_safe_error_payload(
            "VALIDATION_ERROR",
            "Request validation failed.",
            detail=str(exc),
            extra={"errors": exc.errors()},
        ),
    )


@app.exception_handler(Exception)
async def _unhandled_exception_handler(request: Request, exc: Exception):
    # Last-resort JSON error (prevents uvicorn plain-text 500)
    tb = traceback.format_exc(limit=8)
    return JSONResponse(
        status_code=500,
        content=_safe_error_payload(
            "UNHANDLED_EXCEPTION",
            "Internal server error.",
            detail=str(exc),
            extra={"trace": tb, "path": str(request.url.path)},
        ),
    )


# -------------------------
# Health
# -------------------------
@app.get("/")
def root():
    return {"status": "ok"}


# -------------------------
# Exports
# -------------------------
@app.get("/api/export/first-position")
def export_first_position(
    limit: int = Query(69, ge=1, le=69),
    source: str = Query("auto"),
):
    return export_by_first_position(limit=limit, source=source)


@app.get("/api/export/first-position.xlsx")
def export_first_position_excel(
    background_tasks: BackgroundTasks,
    limit: int = Query(69, ge=1, le=69),
    source: str = Query("auto"),
):
    # Create a temp file for download
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    tmp_path = tmp.name
    tmp.close()

    try:
        out_path = export_first_position_xlsx(limit=limit, source=source, output_path=tmp_path)
    except Exception as e:
        # ensure tmp gets cleaned if xlsx generation fails
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

        return JSONResponse(
            status_code=500,
            content=_safe_error_payload(
                "EXPORT_FIRST_POSITION_XLSX_FAILED",
                "Failed to generate XLSX export.",
                detail=str(e),
            ),
        )

    def _cleanup(p: str):
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except Exception:
            pass

    background_tasks.add_task(_cleanup, out_path)

    return FileResponse(
        path=out_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="powerball_first_position_export.xlsx",
    )


# -------------------------
# History
# -------------------------
@app.get("/api/history/by-position")
def history_by_position(pos: int, num: int, limit: int = 5000):
    return list_draws_by_position(pos, num, limit)


@app.get("/api/history/filter")
def history_filter(
    white1: int | None = None,
    white2: int | None = None,
    white3: int | None = None,
    white4: int | None = None,
    white5: int | None = None,
    powerball: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    complete: int = 1,
    sort: str = "draw_date",
    direction: str = "asc",
    output: str = "json",
    limit: int = 5000,
):
    return list_draws_filtered(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        date_from=date_from,
        date_to=date_to,
        complete=(complete == 1),
        sort=sort,
        direction=direction,
        output=output,
        limit=limit,
    )


@app.get("/api/history/filter/or")
def history_filter_or(
    white1: int | None = None,
    white2: int | None = None,
    white3: int | None = None,
    white4: int | None = None,
    white5: int | None = None,
    powerball: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    complete: int = 1,
    sort: str = "draw_date",
    direction: str = "asc",
    output: str = "lines",
    limit: int = 5000,
):
    return list_draws_filtered_or(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        date_from=date_from,
        date_to=date_to,
        complete=(complete == 1),
        sort=sort,
        direction=direction,
        output=output,
        limit=limit,
    )


@app.get("/api/history/filter/atleast")
def history_filter_atleast(
    white1: int | None = None,
    white2: int | None = None,
    white3: int | None = None,
    white4: int | None = None,
    white5: int | None = None,
    powerball: int | None = None,
    min_match: int = 2,
    date_from: str | None = None,
    date_to: str | None = None,
    complete: int = 1,
    sort: str = "score",
    direction: str = "desc",
    output: str = "lines",
    limit: int = 5000,
):
    return list_draws_filtered_atleast(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        min_match=min_match,
        date_from=date_from,
        date_to=date_to,
        complete=(complete == 1),
        sort=sort,
        direction=direction,
        output=output,
        limit=limit,
    )


# -------------------------
# Future (Quick Picks)
# -------------------------
@app.post("/api/future/quickpick")
def api_future_quickpick(
    n: int = Query(1, ge=1, le=500),
    draw_date: Optional[str] = Query(None),
    seed: Optional[int] = Query(None),
):
    return create_future_quickpicks(
        n=n,
        draw_date=draw_date,
        seed=seed,
        meta={"source": "quickpick"},
    )


@app.get("/api/future/filter")
def api_future_filter(
    white1: Optional[int] = None,
    white2: Optional[int] = None,
    white3: Optional[int] = None,
    white4: Optional[int] = None,
    white5: Optional[int] = None,
    powerball: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    complete: int = 0,
    output: str = "json",
    sort: str = "created_at",
    direction: str = "desc",
    limit: int = 200,
):
    return list_future_filtered(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        date_from=date_from,
        date_to=date_to,
        complete=complete,
        output=output,
        sort=sort,
        direction=direction,
        limit=limit,
    )


@app.get("/api/future/filter/or")
def api_future_filter_or(
    white1: Optional[int] = None,
    white2: Optional[int] = None,
    white3: Optional[int] = None,
    white4: Optional[int] = None,
    white5: Optional[int] = None,
    powerball: Optional[int] = None,
    complete: int = 0,
    output: str = "json",
    sort: str = "created_at",
    direction: str = "desc",
    limit: int = 200,
):
    return list_future_filtered_or(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        complete=complete,
        output=output,
        sort=sort,
        direction=direction,
        limit=limit,
    )


@app.get("/api/future/filter/atleast")
def api_future_filter_atleast(
    white1: Optional[int] = None,
    white2: Optional[int] = None,
    white3: Optional[int] = None,
    white4: Optional[int] = None,
    white5: Optional[int] = None,
    powerball: Optional[int] = None,
    min_match: int = 2,
    complete: int = 0,
    output: str = "json",
    sort: str = "score",
    direction: str = "desc",
    limit: int = 200,
):
    return list_future_filtered_atleast(
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
        min_match=min_match,
        complete=complete,
        output=output,
        sort=sort,
        direction=direction,
        limit=limit,
    )


@app.post("/api/future/import-excel")
async def api_future_import_excel(
    file: UploadFile = File(...),
    sheet_name: str | None = None,
):
    suffix = os.path.splitext(file.filename or "")[1] or ".xlsx"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = import_future_from_excel(tmp_path, sheet_name=sheet_name)
        return result
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.post("/api/future/quickpick/unique")
def api_future_quickpick_unique(
    n: int = Query(1, ge=1, le=100),
    draw_date: str | None = None,
    seed: int | None = None,
    white1: int | None = None,
    white2: int | None = None,
    white3: int | None = None,
    white4: int | None = None,
    white5: int | None = None,
    powerball: int | None = None,
):
    return create_future_quickpicks_unique(
        n=n,
        draw_date=draw_date,
        seed=seed,
        white1=white1,
        white2=white2,
        white3=white3,
        white4=white4,
        white5=white5,
        powerball=powerball,
    )
