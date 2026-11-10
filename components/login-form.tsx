"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      if (r.ok) { router.push(params.get("next") || "/app"); router.refresh(); }
      else { const data = await r.json().catch(() => ({})); setError(data.error || "Login failed."); }
    } catch { setError("Login failed — network error."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="flex flex-col gap-4">
    <label className="text-sm text-dim" htmlFor="password">Dashboard password</label>
    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required className="rounded-md border border-line bg-basalt px-3 py-2 text-sm text-ink placeholder:text-dim" placeholder="ADMIN_PASSWORD" />
    {error && <p className="text-sm text-bad">{error}</p>}
    <button type="submit" disabled={busy} className="rounded-md bg-amber px-4 py-2 text-sm font-semibold text-basalt disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
    <p className="text-xs text-dim">Set the password with the ADMIN_PASSWORD environment variable.</p>
  </form>;
}
