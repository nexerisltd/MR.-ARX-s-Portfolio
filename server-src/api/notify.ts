/**
 * Tumi je tracking link (?v=code) dile, keu seta prothom khulle Telegram e ping:
 * "Recruiter — Acme just opened your portfolio". Ek session e ekbar-i (events table e dedupe).
 * Telegram env na thakle kichu kore na.
 */
export const config = { runtime: "edge" };

//#inline bots
//#inline geo
//#inline tg
const J = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export default async function handler(req: Request) {
  if (req.method !== "POST") return J({ error: "method" }, 405);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.TELEGRAM_BOT_TOKEN) return J({ ok: false, reason: "not_configured" });
  const ua = req.headers.get("user-agent") || "";
  if (classify(ua).isBot) return J({ error: "bot" }, 403);
  const origin = req.headers.get("origin");
  try { if (origin && new URL(origin).host !== new URL(req.url).host) return J({ error: "origin" }, 403); } catch { return J({ error: "origin" }, 403); }

  let b: { code?: unknown; sid?: unknown } = {};
  try { b = await req.json(); } catch { return J({ error: "bad_request" }, 400); }
  const code = typeof b.code === "string" && /^[a-z0-9_-]{1,40}$/i.test(b.code) ? b.code.toLowerCase() : null;
  const sid = typeof b.sid === "string" && /^[A-Za-z0-9-]{16,64}$/.test(b.sid) ? b.sid : null;
  if (!code || !sid) return J({ error: "bad_request" }, 400);

  const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const link = (await (await fetch(`${url}/rest/v1/track_links?select=label&code=eq.${code}&limit=1`, { headers: H })).json().catch(() => [])) as { label: string }[];
  if (!link.length) return J({ error: "unknown_link" }, 404);
  const seen = (await (await fetch(`${url}/rest/v1/events?select=id&name=eq.link_open&label=eq.${code}&session_id=eq.${sid}&limit=1`, { headers: H })).json().catch(() => [])) as unknown[];
  if (seen.length) return J({ ok: true, dup: true });
  await fetch(`${url}/rest/v1/events`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ name: "link_open", label: code, session_id: sid, path: "/" }) });
  const g = where(req);
  const place = [g.city ?? "", g.country ?? ""].filter(Boolean).join(", ") || "unknown location";
  await tg(`👀 <b>${esc(link[0].label)}</b> just opened your portfolio\n📍 ${esc(place)}`);
  return J({ ok: true });
}
