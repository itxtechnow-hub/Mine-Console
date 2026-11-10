// lib/store.js — Blob-backed config + request logs, with credential encryption.
import { put, list } from "@vercel/blob";
import crypto from "node:crypto";

const CONFIG_KEY = "omniroute/config.json";
const LOGS_KEY = "omniroute/logs.json";
const MAX_LOGS = 400;
/** @type {{ config: any, logs: any[], blobError: string | null }} */
const memory = { config: null, logs: [], blobError: null };

function emptyConfig() { return { connections: {}, combos: {}, settings: { logRetention: MAX_LOGS } }; }

export function blobStatus() { return { configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN), error: memory.blobError }; }

async function blobGetJson(key) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const result = await list({ prefix: key, limit: 10 });
    const blob = result.blobs.find((item) => item.pathname === key);
    if (!blob) return null;
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) { const msg = String((e && e.message) || e); if (/not found|does not exist|404/i.test(msg)) return null; memory.blobError = msg.slice(0, 300); return null; }
}

async function blobPutJson(key, obj) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return false;
  try { await put(key, JSON.stringify(obj), { access: "public", addRandomSuffix: false, contentType: "application/json" }); return true; }
  catch (e) { memory.blobError = String((e && e.message) || e).slice(0, 300); return false; }
}

export async function getConfig() {
  if (memory.config) return memory.config;
  const stored = await blobGetJson(CONFIG_KEY);
  memory.config = stored && typeof stored === "object" ? { ...emptyConfig(), ...stored } : emptyConfig();
  return memory.config;
}
export async function saveConfig(config) { memory.config = config; await blobPutJson(CONFIG_KEY, config); return config; }
export async function mutateConfig(fn) { const config = await getConfig(); const result = fn(config); await saveConfig(config); return result; }
export async function getLogs() { if (memory.logs.length) return memory.logs; const stored = await blobGetJson(LOGS_KEY); if (Array.isArray(stored)) memory.logs = stored; return memory.logs; }
export async function addLog(entry) { const logs = await getLogs(); logs.unshift({ t: Date.now(), ...entry }); const retention = (await getConfig()).settings?.logRetention || MAX_LOGS; memory.logs = logs.slice(0, retention); await blobPutJson(LOGS_KEY, memory.logs); }
export async function clearLogs() { memory.logs = []; await blobPutJson(LOGS_KEY, []); }

function encryptionKey() { const hex = process.env.CREDENTIAL_ENCRYPTION_KEY || ""; if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null; return Buffer.from(hex, "hex"); }
export function encryptionReady() { return Boolean(encryptionKey()); }
export function encryptSecret(plain) {
  const key = encryptionKey();
  if (!key) return "plain:" + plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  return ["enc", iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}
export function decryptSecret(stored) {
  if (typeof stored !== "string") return null;
  if (stored.startsWith("plain:")) return stored.slice(6);
  if (!stored.startsWith("enc:")) return null;
  const key = encryptionKey(); if (!key) return null;
  try { const [, ivB64, tagB64, dataB64] = stored.split(":"); const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64")); decipher.setAuthTag(Buffer.from(tagB64, "base64")); return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8"); }
  catch { return null; }
}
export function maskSecret(stored) { if (typeof stored !== "string" || !stored) return "—"; const tail = stored.slice(-4); const prefix = stored.startsWith("enc:") ? "encrypted ····" : "···"; return `${prefix}${tail}`; }
export function newId(prefix) { return `${prefix}-${crypto.randomBytes(4).toString("hex")}`; }
