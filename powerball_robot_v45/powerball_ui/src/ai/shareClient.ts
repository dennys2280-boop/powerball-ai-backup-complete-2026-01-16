export async function createShare(payload: any, note?: string) {
  const res = await fetch("http://localhost:8000/api/share/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload, note }),
  });
  return res.json();
}

export async function fetchShare(shareId: string) {
  const res = await fetch(`http://localhost:8000/api/share/${shareId}`);
  return res.json();
}
