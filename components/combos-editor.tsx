"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Conn = { id: string; label: string; models: string[] };
type Target = { connId: string; model: string };
type Combo = { model: string; targets: Target[] };

export default function CombosEditor({ connections, combos }: { connections: Conn[]; combos: Record<string, string[]> }) {
  const router = useRouter();
  const [rows, setRows] = useState<Combo[]>(Object.entries(combos).map(([model, targets]) => ({ model, targets: targets.map((t) => { const slash = t.indexOf("/"); return { connId: t.slice(0, slash), model: t.slice(slash + 1) }; }) })));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const update = (fn: (draft: Combo[]) => void) => setRows((prev) => { const draft = JSON.parse(JSON.stringify(prev)) as Combo[]; fn(draft); return draft; });
  async function save() {
    setBusy(true); setMessage(null);
    const combosOut: Record<string, string[]> = {};
    for (const row of rows) { if (!row.model.trim()) continue; const targets = row.targets.filter((t) => t.connId && t.model.trim()).map((t) => `${t.connId}/${t.model.trim()}`); if (targets.length) combosOut[row.model.trim()] = targets; }
    try {
      const r = await fetch("/api/admin/combos", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ combos: combosOut }) });
      if (r.ok) { setMessage("Combos saved."); router.refresh(); } else { const data = await r.json().catch(() => ({})); setMessage(data.error || "Save failed."); }
    } finally { setBusy(false); }
  }
  if (connections.length === 0) return <p className="mt-6 text-sm text-dim">Add a provider connection first — combos map models to connections.</p>;
  return <div className="mt-6">
    {rows.map((row, ri) => <div key={ri} className="mb-4 rounded-md border border-line bg-panel p-4">
      <div className="flex items-center gap-3"><input value={row.model} onChange={(e) => update((d) => { d[ri].model = e.target.value; })} placeholder="public-model-name" className="w-56 rounded-md border border-line bg-basalt px-3 py-1.5 font-mono text-xs text-ink placeholder:text-dim" /><span className="text-xs text-dim">→</span><button onClick={() => update((d) => { d[ri].targets.push({ connId: connections[0].id, model: "" }); })} className="rounded-md border border-line px-2.5 py-1 text-xs text-copper hover:border-copper">Add target</button><button onClick={() => update((d) => { d.splice(ri, 1); })} className="ml-auto text-xs text-dim hover:text-bad">Remove combo</button></div>
      <div className="mt-3 flex flex-col gap-2">{row.targets.map((t, ti) => <div key={ti} className="flex flex-wrap items-center gap-2"><span className="w-16 text-[11px] text-dim">{ti === 0 ? "Primary" : `Fallback ${ti}`}</span><select value={t.connId} onChange={(e) => update((d) => { d[ri].targets[ti].connId = e.target.value; })} className="rounded-md border border-line bg-basalt px-2 py-1.5 text-xs text-ink">{connections.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select><input value={t.model} onChange={(e) => update((d) => { d[ri].targets[ti].model = e.target.value; })} list={`models-${t.connId}`} placeholder="upstream-model-id" className="w-64 rounded-md border border-line bg-basalt px-3 py-1.5 font-mono text-xs text-ink placeholder:text-dim" /><datalist id={`models-${t.connId}`}>{(connections.find((c) => c.id === t.connId)?.models || []).map((m) => <option key={m} value={m} />)}</datalist><button onClick={() => update((d) => { d[ri].targets.splice(ti, 1); })} className="text-xs text-dim hover:text-bad">✕</button></div>)}</div>
    </div>)}
    <div className="flex items-center gap-3"><button onClick={() => update((d) => { d.push({ model: "", targets: [{ connId: connections[0].id, model: "" }] }); })} className="rounded-md border border-line px-3.5 py-1.5 text-sm text-ink hover:border-dim">Add combo</button><button onClick={save} disabled={busy} className="rounded-md bg-amber px-4 py-1.5 text-sm font-semibold text-basalt disabled:opacity-50">{busy ? "Saving…" : "Save combos"}</button>{message && <span className="text-sm text-dim">{message}</span>}</div>
  </div>;
}
