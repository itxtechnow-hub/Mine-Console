"use client";

import { useEffect, useState } from "react";

export default function CopyBlock({ language, children }: { language: string; children: string }) {
  const [text, setText] = useState(children);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setText(children.replace(/\{origin\}/g, window.location.origin)); }, [children]);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard unavailable — user can select manually */ }
  }
  return <div className="relative rounded-md border border-line bg-basalt">
    <button onClick={copy} className="absolute right-2 top-2 rounded border border-line px-2 py-0.5 text-[11px] text-dim hover:border-copper hover:text-copper">{copied ? "Copied" : "Copy"}</button>
    <pre className="overflow-x-auto p-4 pr-16 font-mono text-xs leading-relaxed text-ink"><code>{text}</code></pre>
    <span className="absolute right-2 bottom-2 text-[10px] text-dim">{language}</span>
  </div>;
}
