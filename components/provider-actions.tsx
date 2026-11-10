"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Conn = { id: string; label: string; baseUrl: string; protocol: string };

export default function ProviderActions({ conn }: { conn: Conn }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(conn.label);
  const [baseUrl, setBaseUrl] = useState(conn.baseUrl);
  const [newKey, setNewKey] = useState("");

  async function call(action: "test" | "discover") {
    setBusy(action);
    setResult(null);
    try {
      const r = await fetch(`/api/admin/providers/${conn.id}/${action}`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (data.ok) {
        setResult(action === "test" ? `Connection verified in ${data.ms}ms${data.modelsFound ? ` — ${data.modelsFound} models visible` : ""}.` : `Discovered ${data.discovered} models.`);
      } else setResult(`Failed: ${data.error || data.detail || "unknown error"}`);
      router.refresh();
    } catch { setResult("Network error."); }
    finally { setBusy(null); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy("save");
    try {
      await fetch(`/api/admin/providers/${conn.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ label, baseUrl, apiKey: newKey || undefined }) });
      setEditing(false); setNewKey(""); router.refresh();
    } finally { setBusy(null); }
  }

  async function remove() {
    if (!confirm(`Remove ${conn.label}? Combos referencing it will be cleaned up.`)) return;
    setBusy("delete");
    try { await fetch(`/api/admin/providers/${conn.id}`, { method: "DELETE" }); router.push("/app/providers"); router.refresh(); }
    finally { setBusy(null); }
  }

  return <div className="mt-6 rounded-md border border-line bg-panel p-5">
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => call("test")} disabled={busy !== null} className="rounded-md bg-amber px-3.5 py-1.5 text-sm font-semibold text-basalt disabled:opacity-50">{busy === "test" ? "Testing…" : "Test connection"}</button>
      <button onClick={() => call("discover")} disabled={busy !== null} className="rounded-md border border-line px-3.5 py-1.5 text-sm text-ink hover:border-dim disabled:opacity-50">{busy === "discover" ? "Discovering…" : "Discover models"}</button>
      <button onClick={() => setEditing(!editing)} className="rounded-md border border-line px-3.5 py-1.5 text-sm text-dim hover:text-ink">{editing ? "Close editor" : "Edit"}</button>
      <button onClick={remove} disabled={busy !== null} className="ml-auto rounded-md border border-line px-3.5 py-1.5 text-sm text-bad hover:border-bad disabled:opacity-50">{busy === "delete" ? "Removing…" : "Remove"}</button>
    </div>
    {result && <p className="mt-3 text-sm text-dim">{result}</p>}
    {editing && <form onSubmit={save} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
      <label className="text-xs text-dim">Label<input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 text-sm text-ink" /></label>
      <label className="text-xs text-dim">Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 font-mono text-xs text-ink" /></label>
      <label className="text-xs text-dim sm:col-span-2">Replace API key (leave empty to keep the current one)<input value={newKey} onChange={(e) => setNewKey(e.target.value)} type="password" className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 font-mono text-xs text-ink" /></label>
      <button type="submit" disabled={busy !== null} className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-basalt disabled:opacity-50 sm:col-span-2">{busy === "save" ? "Saving…" : "Save changes"}</button>
    </form>}
  </div>;
}
