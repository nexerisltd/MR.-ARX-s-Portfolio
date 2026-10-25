/**
 * Vercel Routing Middleware: JS na-chalano bot (Googlebot, GPTBot, curl, scanner...) server-side e
 * dhore Supabase `bot_hits` e likhe. Manush visitor der track client-side e hoy.
 *
 * ⚠️ Ei file e KONO `import` nai — ata ei jonno: Vercel middleware/api file gulo alada alada compile kore,
 * bundle kore na. Onno folder (src/…) theke import korle runtime e file khuje pay na → site 500 hoye jay.
 * Shared code (bot list) `npm run sync:server` diye niche inline kore deya hoy.
 */
export const config = { matcher: ["/((?!api/|assets/|character/|.*\\..*).*)"] };

//#inline bots
//#inline geo

const passThrough = () => new Response(null, { headers: { "x-middleware-next": "1" } });

async function log(request: Request, name: string, category: string, ua: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const g = where(request);
  const ip = clientIp(request);
  await fetch(`${url}/rest/v1/bot_hits`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      path: new URL(request.url).pathname.slice(0, 200),
      user_agent: ua.slice(0, 300),
      bot_name: name.slice(0, 60),
      bot_category: category,
      country: g.country, region: g.region, city: g.city,
      ip_hash: ip ? await sha((process.env.IP_SALT || "nexeris") + ip, 8) : null,
      ip: process.env.STORE_RAW_IP === "1" ? ip : null,
    }),
  });
}

export default function middleware(request: Request, context?: { waitUntil?: (p: Promise<unknown>) => void }) {
  try {
    if (request.method === "GET" || request.method === "HEAD") {
      const ua = request.headers.get("user-agent") || "";
      const c = classify(ua);
      if (c.isBot) {
        const p = log(request, c.name, c.category, ua).catch(() => {});
        try { context?.waitUntil?.(p); } catch { /* ignore */ }
      }
    }
  } catch { /* kono error hole-o site atkabe na */ }
  return passThrough();
}
