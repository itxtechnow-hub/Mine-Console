"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Conn = { id: string; label: string; providerId: string; status: string };

function StatusDot({ status }: { status: string }) {
  const color = status === "verified" ? "bg-ok" : status === "failed" ? "bg-bad" : "bg-dim";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

export default function Sidebar({ connections }: { connections: Conn[] }) {
  const pathname = usePathname();
  const router = useRouter();

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`rounded-[5px] px-3 py-1.5 text-sm ${active ? "border border-line bg-panel text-ink" : "text-dim hover:bg-panel hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  };

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-basalt px-3 py-5 max-lg:w-full max-lg:flex-row max-lg:items-center max-lg:overflow-x-auto">
      <div className="px-2 max-lg:hidden">
        <p className="text-sm font-semibold tracking-tight" style={{ fontStretch: "118%" }}>
          OmniRoute
        </p>
        <p className="text-[11px] text-dim">AI gateway on Vercel</p>
      </div>

      <nav className="mt-6 flex flex-col gap-0.5 max-lg:mt-0 max-lg:flex-row max-lg:gap-1">
        {link("/app", "Overview")}

        <p className="px-3 pb-1 pt-4 text-[11px] text-dim max-lg:hidden">Providers</p>
        {connections.map((c) => {
          const href = `/app/providers/${c.id}`;
          return (
            <Link
              key={c.id}
              href={href}
              className={`flex items-center gap-2 rounded-[5px] px-3 py-1.5 text-sm ${pathname === href ? "border border-line bg-panel text-ink" : "text-dim hover:bg-panel hover:text-ink"}`}
            >
              <StatusDot status={c.status} />
              <span className="truncate">{c.label}</span>
            </Link>
          );
        })}
        {link("/app/providers", connections.length ? "Add provider" : "Add first provider")}

        <p className="px-3 pb-1 pt-4 text-[11px] text-dim max-lg:hidden">Gateway</p>
        {link("/app/models", "Models")}
        {link("/app/combos", "Combos")}
        {link("/app/logs", "Logs")}
        {link("/app/cli", "CLI setup")}
        {link("/app/settings", "Settings")}
      </nav>

      <button
        onClick={logout}
        className="mt-6 rounded-[5px] px-3 py-1.5 text-left text-sm text-dim hover:text-ink max-lg:mt-0 max-lg:shrink-0"
      >
        Sign out
      </button>
    </aside>
  );
}
