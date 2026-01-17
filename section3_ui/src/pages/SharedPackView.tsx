import React, { useEffect, useState } from "react";
import { fetchShare } from "../ai/shareClient";

export default function SharedPackView({ shareId }: { shareId: string }) {
  const [out, setOut] = useState<any>(null);

  useEffect(() => {
    fetchShare(shareId).then(setOut).catch(() => setOut({ status: "error", message: "fetch_failed" }));
  }, [shareId]);

  return (
    <div style={{ padding: 16, background: "#0f172a", color: "#e2e8f0", minHeight: "100vh" }}>
      <h2>Shared Pack</h2>
      <p style={{ opacity: 0.85 }}>ID: {shareId}</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#0b1220", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 12 }}>
        {JSON.stringify(out, null, 2)}
      </pre>
    </div>
  );
}
