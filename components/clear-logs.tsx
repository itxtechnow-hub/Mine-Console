"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClearLogsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function clear() {
    if (!confirm("Clear all request logs?")) return;
    setBusy(true);
    try { await fetch("/api/admin/logs", { method: "DELETE" }); router.refresh(); }
    finally { setBusy(false); }
  }
  return <button onClick={clear} disabled={busy} className="text-xs text-dim hover:text-bad disabled:opacity-50">{busy ? "Clearing…" : "Clear logs"}</button>;
}
