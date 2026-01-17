from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional
from io import BytesIO
from starlette.responses import StreamingResponse

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

router = APIRouter(prefix="/api/export", tags=["export"])

class ExportPdfRequest(BaseModel):
    payload: Dict[str, Any]
    title: str = "Powerball AI Pack"
    share_id: Optional[str] = None

@router.post("/pdf")
def export_pdf(req: ExportPdfRequest):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    w, h = letter

    y = h - 48
    c.setFont("Helvetica-Bold", 16)
    c.drawString(48, y, req.title)
    y -= 18
    c.setFont("Helvetica", 10)
    if req.share_id:
        c.drawString(48, y, f"Share ID: {req.share_id}")
        y -= 14

    c.setFont("Helvetica", 9)
    c.drawString(48, y, "Nota: Este reporte resume heurísticas/estadísticas. No garantiza resultados.")
    y -= 18

    payload = req.payload or {}
    by = payload.get("results_by_assistant", {}) or {}

    for aid, obj in by.items():
        c.setFont("Helvetica-Bold", 12)
        c.drawString(48, y, f"Asistente: {aid}")
        y -= 14
        c.setFont("Helvetica", 10)
        sugg = (obj.get("suggestions", []) or [])[:15]
        for i, s in enumerate(sugg, start=1):
            line = f"{i:02d}) {'-'.join(str(x) for x in s.get('whites',[]))}  PB {s.get('powerball')}"
            c.drawString(60, y, line)
            y -= 12
            if y < 72:
                c.showPage()
                y = h - 48
        y -= 10
        if y < 72:
            c.showPage()
            y = h - 48

    c.showPage()
    c.save()
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition":"attachment; filename=powerball_pack.pdf"})
