/**
 * "Start a project" form. Server e validate + spam guard, tarpor Supabase e (service role) likha.
 * Guard: same-origin, bot block, honeypot, minimum fill time, ek network theke 24h e max 3 ta.
 */
export const config = { runtime: "edge" };

//#inline bots
//#inline lists
//#inline geo
//#inline tg

const J = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const one = <T extends readonly string[]>(v: unknown, list: T): T[number] | null => (typeof v === "string" && (list as readonly string[]).includes(v) ? v : null);

export default async function handler(req: Request) {
  if (req.method !== "POST") return J({ error: "method" }, 405);
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return J({ error: "not_configured" }, 503);

  const ua = req.headers.get("user-agent") || "";
  if (classify(ua).isBot) return J({ error: "bot" }, 403);
  const origin = req.headers.get("origin");
  try { if (origin && new URL(origin).host !== new URL(req.url).host) return J({ error: "origin" }, 403); } catch { return J({ error: "origin" }, 403); }

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return J({ error: "bad_request" }, 400); }
  if (b.hp) return J({ error: "bad_request" }, 400);
  if (typeof b.t !== "number" || b.t < 4000) return J({ error: "too_fast" }, 400);

  const name = str(b.name, 80), email = str(b.email, 120).toLowerCase(), message = str(b.message, 2000);
  if (name.length < 1) return J({ error: "invalid", field: "name" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return J({ error: "invalid", field: "email" }, 400);
  if (message.length < 10) return J({ error: "invalid", field: "message" }, 400);
  const services = (Array.isArray(b.services) ? b.services : []).map((s) => one(s, SERVICES)).filter((s): s is (typeof SERVICES)[number] => !!s).slice(0, 5);
  const budget = one(b.budget, BUDGETS), timeline = one(b.timeline, TIMELINES);
  const vid = typeof b.vid === "string" && /^[A-Za-z0-9-]{16,64}$/.test(b.vid) ? b.vid : null;
  const sid = typeof b.sid === "string" && /^[A-Za-z0-9-]{16,64}$/.test(b.sid) ? b.sid : null;
  const link = typeof b.link === "string" && /^[a-z0-9_-]{1,40}$/i.test(b.link) ? b.link.toLowerCase() : null;

  const ip = clientIp(req);
  const g = where(req);
  const netHash = ip ? await sha(`${process.env.IP_SALT || "nexeris"}|${ip}`) : null;
  const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  if (netHash) {
    const since = encodeURIComponent(new Date(Date.now() - 86400000).toISOString());
    const r = await fetch(`${url}/rest/v1/inquiries?select=id&ip_hash=eq.${netHash}&created_at=gte.${since}&limit=3`, { headers: H });
    if (r.ok && ((await r.json()) as unknown[]).length >= 3) return J({ error: "rate_limited" }, 429);
  }
  const ins = await fetch(`${url}/rest/v1/inquiries`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ name, email, message, services, budget, timeline, visitor_id: vid, session_id: sid, link_code: link, ip_hash: netHash, country: g.country ?? null, city: g.city ?? null }),
  });
  if (!ins.ok) return J({ error: "db" }, 500);
  await tg(
    `📩 <b>New inquiry</b> — ${esc(name)}\n✉️ ${esc(email)}\n🛠 ${esc(services.join(", ") || "—")}\n💰 ${esc(budget ?? "—")} · ⏱ ${esc(timeline ?? "—")}\n📍 ${esc([g.city ?? "", g.country ?? ""].filter(Boolean).join(", ") || "unknown")}\n\n${esc(message.slice(0, 500))}`
  );
  return J({ ok: true });
}
