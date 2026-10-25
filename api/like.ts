import { ipAddress } from "@vercel/functions/headers";
import { classify } from "../src/lib/bots.js";

/**
 * Login chhara like. Ek jon 7 diner moddhe (target prati) ekbar-i like dite pare.
 * Limit SERVER e enforce hoy (client er upor bharosha nai):
 *   1) visitor_id  — browser er random id (localStorage)
 *   2) net_hash    — sha256(salt + IP + User-Agent). Raw IP save hoy na.
 * Je kono ekta match korle block. Likhte Supabase SERVICE ROLE key lage (shudhu Vercel env e, browser e jay na).
 */
export const config = { runtime: "edge" };

const WEEK = 7 * 86400000;
const J = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function cfg() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}
type C = { url: string; key: string };

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const db = (c: C, path: string, init: RequestInit = {}) =>
  fetch(`${c.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, "Content-Type": "application/json", ...(init.headers as Record<string, string> | undefined) },
  });

const validVid = (v: unknown): string | null => (typeof v === "string" && /^[A-Za-z0-9-]{16,64}$/.test(v) ? v : null);
const validTarget = (t: unknown): t is string => typeof t === "string" && /^(site|project:[A-Za-z0-9_-]{1,50})$/.test(t);

async function counts(c: C): Promise<Record<string, number>> {
  const r = await db(c, "rpc/like_counts", { method: "POST", body: "{}" });
  const rows = r.ok ? ((await r.json()) as { target: string; n: number }[]) : [];
  return Object.fromEntries(rows.map((x) => [x.target, Number(x.n)]));
}

async function recent(c: C, vid: string | null, net: string | null, target?: string) {
  const ors: string[] = [];
  if (vid) ors.push(`visitor_id.eq.${vid}`);
  if (net) ors.push(`net_hash.eq.${net}`);
  if (!ors.length) return [] as { target: string; created_at: string }[];
  const since = encodeURIComponent(new Date(Date.now() - WEEK).toISOString());
  let q = `likes?select=target,created_at&or=(${ors.join(",")})&created_at=gte.${since}&order=created_at.desc`;
  if (target) q += `&target=eq.${encodeURIComponent(target)}`;
  const r = await db(c, q);
  return r.ok ? ((await r.json()) as { target: string; created_at: string }[]) : [];
}

export default async function handler(req: Request) {
  const c = cfg();
  if (!c) return J({ error: "not_configured" }, 503);
  const ua = req.headers.get("user-agent") || "";
  if (classify(ua).isBot) return J({ error: "bot" }, 403);

  const ip = ipAddress(req);
  const net = ip ? await sha(`${process.env.IP_SALT || "nexeris"}|${ip}|${ua}`) : null;
  const u = new URL(req.url);

  if (req.method === "GET") {
    const vid = validVid(u.searchParams.get("vid"));
    const [cn, rec] = await Promise.all([counts(c), recent(c, vid, net)]);
    const liked: Record<string, string> = {};
    for (const r of rec) if (!liked[r.target]) liked[r.target] = r.created_at;
    return J({ counts: cn, liked, weekMs: WEEK });
  }

  if (req.method === "POST") {
    // same-origin chhara kono request nai
    const origin = req.headers.get("origin");
    try { if (origin && new URL(origin).host !== u.host) return J({ error: "origin" }, 403); } catch { return J({ error: "origin" }, 403); }

    let b: { target?: unknown; vid?: unknown; t?: unknown; hp?: unknown } = {};
    try { b = await req.json(); } catch { return J({ error: "bad_request" }, 400); }
    if (b.hp) return J({ error: "bad_request" }, 400); // honeypot
    if (typeof b.t !== "number" || b.t < 1200) return J({ error: "too_fast" }, 400); // page khulei script-er moto like
    if (!validTarget(b.target)) return J({ error: "bad_target" }, 400);
    const vid = validVid(b.vid);
    if (!vid && !net) return J({ error: "no_identity" }, 400);

    const prev = await recent(c, vid, net, b.target);
    if (prev.length) return J({ error: "already_liked", liked_at: prev[0].created_at, weekMs: WEEK, counts: await counts(c) }, 429);

    const ins = await db(c, "likes", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ target: b.target, visitor_id: vid, net_hash: net }) });
    if (ins.status === 409) return J({ error: "already_liked", liked_at: new Date().toISOString(), weekMs: WEEK, counts: await counts(c) }, 429);
    if (!ins.ok) return J({ error: "db" }, 500);
    return J({ ok: true, liked_at: new Date().toISOString(), counts: await counts(c) });
  }
  return J({ error: "method" }, 405);
}
