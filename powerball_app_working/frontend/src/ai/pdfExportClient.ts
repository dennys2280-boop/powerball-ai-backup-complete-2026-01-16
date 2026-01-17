export async function exportPdf(payload: any, title?: string, share_id?: string) {
  const res = await fetch("http://localhost:8000/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, title: title || "Powerball AI Pack", share_id }),
  });
  if (!res.ok) throw new Error("pdf_export_failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url;
}
