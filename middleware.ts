import { geolocation, ipAddress } from "@vercel/functions/headers";
import { next } from "@vercel/functions/middleware";
import { classify } from "./src/lib/bots";

/**
 * Vercel Routing Middleware: JS na-chalano bot (Googlebot, GPTBot, curl, scanner...) gulo
 * server-side e dhore Supabase `bot_hits` e likhe. Manush visitor der track client-side e hoy.
 * Kono error hole site kokhono atkabe na — shobsomoy next().
 */
export const config = { matcher: ["/((?!api/|assets/|character/|.*\\..*).*)"] };

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function log(request: Request, name: string, category: string, ua: string) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const g = geolocation(request);
  const ip = ipAddress(request);
  await fetch(`${url}/rest/v1/bot_hits`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      path: new URL(request.url).pathname.slice(0, 200),
      user_agent: ua.slice(0, 300),
      bot_name: name.slice(0, 60),
      bot_category: category,
      country: g.country ?? null,
      region: g.countryRegion ?? null,
      city: g.city ?? null,
      ip_hash: ip ? await hash((process.env.IP_SALT || "nexeris") + ip) : null,
      ip: process.env.STORE_RAW_IP === "1" ? ip ?? null : null,
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
        try { context?.waitUntil?.(p); } catch { /* waitUntil nai hole promise tobu cholbe */ }
      }
    }
  } catch { /* ignore */ }
  return next();
}
