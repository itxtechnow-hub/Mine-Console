import Link from "next/link";
import { getConfig, getLogs, blobStatus, encryptionReady } from "@/lib/store";

export const dynamic = "force-dynamic";
function Stat({ value, label }: { value: number | string; label: string }) { return <div className="rounded-md border border-line bg-panel p-4"><p className="font-mono text-xl text-amber">{value}</p><p className="mt-0.5 text-xs text-dim">{label}</p></div>; }

export default async function Overview() {
  const config = await getConfig(); const logs = await getLogs(); const conns = Object.values(config.connections || {});
  const modelCount = conns.reduce((n, c) => n + ((c.models && c.models.length) || 0), 0); const blob = blobStatus();
  return <div><h1 className="text-xl font-semibold tracking-tight" style={{ fontStretch: "118%" }}>Overview</h1>
    {(!blob.configured || blob.error) && <p className="mt-4 rounded-md border border-copper bg-panel p-3 text-sm text-copper">Blob storage is not active — config and logs are held in memory only and reset on cold start. Attach a Vercel Blob store in Project Settings → Storage, then redeploy.{blob.error ? ` Error: ${blob.error}` : ""}</p>}
    {!encryptionReady() && <p className="mt-4 rounded-md border border-copper bg-panel p-3 text-sm text-copper">CREDENTIAL_ENCRYPTION_KEY is not set (64 hex chars) — provider API keys are stored unencrypted. Set it in Vercel environment variables, then re-add your keys.</p>}
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"><Stat value={conns.length} label="Provider connections" /><Stat value={modelCount} label="Models discovered" /><Stat value={Object.keys(config.combos || {}).length} label="Combos" /><Stat value={logs.length} label="Logged requests" /></div>
    <div className="mt-6 rounded-md border border-line bg-panel p-5"><h2 className="text-sm font-semibold">Use the gateway</h2><pre className="mt-3 overflow-x-auto rounded-md border border-line bg-basalt p-4 font-mono text-xs leading-relaxed text-dim">{`curl https://YOUR_APP.vercel.app/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_GATEWAY_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "your-model", "messages": [{"role": "user", "content": "Hello"}]}'`}</pre><p className="mt-3 text-xs text-dim">Anthropic-protocol clients (Claude Code) point at <span className="font-mono text-copper">/v1/messages</span> instead. See <Link href="/app/cli" className="text-copper">CLI setup</Link>.</p></div>
    <div className="mt-6 rounded-md border border-line bg-panel p-5"><div className="flex items-baseline justify-between"><h2 className="text-sm font-semibold">Recent requests</h2><Link href="/app/logs" className="text-xs text-copper">All logs</Link></div>
      {logs.length === 0 ? <p className="mt-3 text-sm text-dim">No requests yet. Point a client at the gateway to see activity here.</p> : <table className="mt-3 w-full text-left text-xs"><tbody>{logs.slice(0,8).map((l,i)=><tr key={i} className="border-t border-line"><td className="py-2 pr-4 font-mono text-dim">{new Date(l.t).toISOString().slice(11,19)}</td><td className="py-2 pr-4 font-mono">{l.model}</td><td className="py-2 pr-4 text-dim">{l.provider}</td><td className={`py-2 pr-4 font-mono ${l.status===200?"text-ok":"text-bad"}`}>{l.status}</td><td className="py-2 font-mono text-dim">{l.ms}ms</td></tr>)}</tbody></table>}
    </div>
  </div>;
}
