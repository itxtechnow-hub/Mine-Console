"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CatalogEntry = { id: string; name: string; category: string; website?: string; baseUrl?: string; protocol?: string; verified?: boolean; hasFree?: boolean; adapterRequired?: boolean };
type Conn = { id: string; label: string; providerId: string; status: string; baseUrl: string };
const CATEGORIES = ["apikey", "oauth", "no-auth", "web-cookie", "local", "search", "audio", "cloud-agent", "upstream-proxy"];

export default function CatalogBrowser({ catalog, connections }: { catalog: CatalogEntry[]; connections: Conn[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("apikey");
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [label, setLabel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [protocol, setProtocol] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return catalog.filter((p) => p.category === category && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))); }, [catalog, query, category]);
  function pick(p: CatalogEntry) { setSelected(p); setLabel(p.name); setBaseUrl(p.baseUrl || ""); setProtocol(p.protocol || "openai"); setApiKey(""); setMessage(null); }
  async function add(e: React.FormEvent) {
    e.preventDefault(); if (!selected) return; setBusy(true); setMessage(null);
    try {
      const r = await fetch("/api/admin/providers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ providerId: selected.id, name: selected.name, label, baseUrl, protocol, apiKey }) });
      const data = await r.json().catch(() => ({}));
      if (r.ok) { setSelected(null); router.refresh(); } else setMessage(data.error || "Could not add provider.");
    } catch { setMessage("Network error."); } finally { setBusy(false); }
  }
  return <div className="mt-6">
    <div className="rounded-md border border-line bg-panel p-5"><h2 className="text-sm font-semibold">Your connections</h2>
      {connections.length === 0 ? <p className="mt-2 text-sm text-dim">None yet — pick a provider from the catalogue below.</p> : <ul className="mt-2 divide-y divide-line">{connections.map((c) => <li key={c.id} className="flex items-center justify-between py-2.5"><Link href={`/app/providers/${c.id}`} className="text-sm hover:text-amber">{c.label}</Link><span className="font-mono text-xs text-dim">{c.baseUrl}</span></li>)}</ul>}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search catalogue…" className="w-56 rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-dim" />
      {CATEGORIES.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`rounded-md border px-2.5 py-1 text-xs ${category === cat ? "border-amber text-amber" : "border-line text-dim hover:text-ink"}`}>{cat}</button>)}
    </div>
    <p className="mt-2 text-xs text-dim">{filtered.length} provider{filtered.length === 1 ? "" : "s"} in {category}</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice(0, 120).map((p) => <button key={p.id} onClick={() => pick(p)} className={`rounded-md border p-3 text-left ${selected?.id === p.id ? "border-amber" : "border-line bg-panel hover:border-dim"}`}>
      <p className="text-sm font-medium">{p.name}</p><p className="mt-0.5 font-mono text-[11px] text-dim">{p.id}</p><div className="mt-2 flex flex-wrap gap-1.5">
        {p.baseUrl && <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ok">{p.verified ? "base URL verified" : "base URL listed"}</span>}
        {p.hasFree && <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-copper">free tier</span>}
        {p.adapterRequired && <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-dim">needs adapter</span>}
      </div></button>)}</div>
    {filtered.length > 120 && <p className="mt-2 text-xs text-dim">Showing 120 of {filtered.length} — refine the search to see more.</p>}
    {selected && <form onSubmit={add} className="mt-6 rounded-md border border-amber bg-panel p-5"><div className="flex items-baseline justify-between"><h3 className="text-sm font-semibold">Add {selected.name}</h3><button type="button" onClick={() => setSelected(null)} className="text-xs text-dim hover:text-ink">Cancel</button></div>
      {selected.website && <p className="mt-1 text-xs text-dim">Get a key at{" "}<a href={selected.website} target="_blank" rel="noreferrer" className="text-copper">{selected.website.replace(/^https?:\/\//, "")}</a></p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs text-dim">Label<input value={label} onChange={(e) => setLabel(e.target.value)} required className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 text-sm text-ink" /></label>
        <label className="text-xs text-dim">Protocol<select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 text-sm text-ink"><option value="openai">OpenAI-compatible</option><option value="anthropic">Anthropic Messages API</option></select></label>
        <label className="text-xs text-dim sm:col-span-2">Base URL {selected.baseUrl ? "(listed — verify before use)" : "(required — paste the provider's OpenAI-compatible endpoint)"}<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} required placeholder="https://api.example.com/v1" className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 font-mono text-xs text-ink" /></label>
        <label className="text-xs text-dim sm:col-span-2">API key (stored encrypted, never returned to the browser)<input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" required className="mt-1 w-full rounded-md border border-line bg-basalt px-3 py-2 font-mono text-xs text-ink" /></label>
      </div>
      {message && <p className="mt-3 text-sm text-bad">{message}</p>}
      <button type="submit" disabled={busy} className="mt-4 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-basalt disabled:opacity-50">{busy ? "Adding…" : "Add provider"}</button>
    </form>}
  </div>;
}
