// lib/auth.js — server-side session helpers (Node runtime).
import crypto from "node:crypto";

const COOKIE_NAME = "omni_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret() { return process.env.AUTH_SECRET || ""; }

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token) {
  if (!token || !secret()) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.exp === "number" && data.exp > Date.now() ? data : null;
  } catch { return null; }
}

export function sessionCookieOptions() {
  return { name: COOKIE_NAME, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_MS / 1000 };
}

export { COOKIE_NAME };
