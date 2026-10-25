// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)
/**
 * Login chhara like. Ek jon 7 diner moddhe (target prati) ekbar-i like dite pare.
 * Limit SERVER e enforce hoy (client er upor bharosha nai):
 *   1) visitor_id  — browser er random id (localStorage)
 *   2) net_hash    — sha256(salt + IP + User-Agent). Raw IP save hoy na.
 * Je kono ekta match korle block. Likhte Supabase SERVICE ROLE key lage (shudhu Vercel env e, browser e jay na).
 */
export const config = { runtime: "edge" };

// ---- bot classifier (src/lib/bots.ts theke) ----
/**
 * Bot / crawler classifier — client (JS-chalano bot), middleware (non-JS bot) duto jaygay use hoy.
 * Pure function: kono DOM/Node API lagbe na.
 */
type BotCategory =
  | "Search engine" | "AI crawler" | "Social preview" | "SEO tool"
  | "Monitoring" | "Script / library" | "Scanner" | "Headless browser" | "Other bot";

interface BotInfo { isBot: boolean; name: string; category: BotCategory | "" }

const R: [RegExp, string, BotCategory][] = [
  // search engines
  [/Googlebot|AdsBot-Google|Mediapartners-Google|APIs-Google|Google-InspectionTool|GoogleOther|Storebot-Google/i, "Googlebot", "Search engine"],
  [/bingbot|BingPreview|msnbot/i, "Bingbot", "Search engine"],
  [/DuckDuckBot|DuckDuckGo-Favicons/i, "DuckDuckBot", "Search engine"],
  [/Baiduspider/i, "Baiduspider", "Search engine"],
  [/YandexBot|YandexImages|YandexMetrika/i, "YandexBot", "Search engine"],
  [/Applebot/i, "Applebot", "Search engine"],
  [/Sogou/i, "Sogou", "Search engine"],
  [/Qwantify|Qwant\//i, "Qwant", "Search engine"],
  [/SeznamBot/i, "SeznamBot", "Search engine"],
  [/Yeti\/|NaverBot/i, "Naver", "Search engine"],
  [/PetalBot/i, "PetalBot", "Search engine"],
  [/Slurp/i, "Yahoo Slurp", "Search engine"],
  // AI crawlers
  [/GPTBot/i, "GPTBot (OpenAI)", "AI crawler"],
  [/ChatGPT-User|OAI-SearchBot/i, "ChatGPT (OpenAI)", "AI crawler"],
  [/ClaudeBot|Claude-Web|anthropic-ai|Claude-User|Claude-SearchBot/i, "Claude (Anthropic)", "AI crawler"],
  [/PerplexityBot|Perplexity-User/i, "Perplexity", "AI crawler"],
  [/CCBot/i, "CCBot (Common Crawl)", "AI crawler"],
  [/Bytespider/i, "Bytespider (ByteDance)", "AI crawler"],
  [/Google-Extended/i, "Google-Extended", "AI crawler"],
  [/Amazonbot/i, "Amazonbot", "AI crawler"],
  [/cohere-ai|cohere-training/i, "Cohere", "AI crawler"],
  [/Meta-ExternalAgent|Meta-ExternalFetcher|FacebookBot/i, "Meta AI", "AI crawler"],
  [/Diffbot/i, "Diffbot", "AI crawler"],
  [/YouBot/i, "YouBot", "AI crawler"],
  [/Omgili/i, "Omgili", "AI crawler"],
  [/ImagesiftBot|Timpibot|Kangaroo Bot/i, "AI image/data crawler", "AI crawler"],
  // social link previews
  [/facebookexternalhit|Facebot/i, "Facebook preview", "Social preview"],
  [/Twitterbot/i, "Twitter / X preview", "Social preview"],
  [/LinkedInBot/i, "LinkedIn preview", "Social preview"],
  [/WhatsApp/i, "WhatsApp preview", "Social preview"],
  [/TelegramBot/i, "Telegram preview", "Social preview"],
  [/Slackbot|Slack-ImgProxy/i, "Slack preview", "Social preview"],
  [/Discordbot/i, "Discord preview", "Social preview"],
  [/Pinterest/i, "Pinterest", "Social preview"],
  [/redditbot/i, "Reddit preview", "Social preview"],
  [/SkypeUriPreview/i, "Skype preview", "Social preview"],
  [/Mastodon|Embedly|vkShare|Viber/i, "Link preview bot", "Social preview"],
  // SEO tools
  [/AhrefsBot|AhrefsSiteAudit/i, "AhrefsBot", "SEO tool"],
  [/SemrushBot/i, "SemrushBot", "SEO tool"],
  [/MJ12bot/i, "Majestic (MJ12bot)", "SEO tool"],
  [/DotBot/i, "DotBot (Moz)", "SEO tool"],
  [/rogerbot/i, "Moz rogerbot", "SEO tool"],
  [/BLEXBot|DataForSeoBot|serpstatbot|Barkrowler|MegaIndex|SiteAuditBot|SEOkicks|Screaming Frog|SISTRIX/i, "SEO crawler", "SEO tool"],
  // monitoring / performance
  [/UptimeRobot/i, "UptimeRobot", "Monitoring"],
  [/Pingdom/i, "Pingdom", "Monitoring"],
  [/Chrome-Lighthouse|Lighthouse|PageSpeed|Google Page Speed/i, "Lighthouse / PageSpeed", "Monitoring"],
  [/GTmetrix|StatusCake|Site24x7|BetterUptime|Better Uptime|HetrixTools|Checkly|Datadog|NewRelic|vercel-screenshot|vercel-favicon|Vercel Edge Functions/i, "Monitoring service", "Monitoring"],
  // headless / automation
  [/HeadlessChrome|PhantomJS|Puppeteer|Playwright|Selenium|Cypress/i, "Headless browser", "Headless browser"],
  // scanners
  [/zgrab|masscan|Nmap|nikto|sqlmap|WPScan|Nuclei|censys|Expanse|Shodan|NetSystemsResearch|l9explore|BinaryEdge|InternetMeasurement|ALittle Client|Go-http-client\/1\.1 \(compatible/i, "Security scanner", "Scanner"],
  // http libraries / scripts
  [/curl\//i, "curl", "Script / library"],
  [/Wget/i, "Wget", "Script / library"],
  [/python-requests|python-urllib|python-httpx|aiohttp|Python\//i, "Python script", "Script / library"],
  [/Go-http-client/i, "Go http client", "Script / library"],
  [/axios|node-fetch|undici|got \(|node\//i, "Node.js script", "Script / library"],
  [/okhttp/i, "OkHttp", "Script / library"],
  [/Java\/|Apache-HttpClient|Jakarta/i, "Java client", "Script / library"],
  [/libwww-perl|LWP::/i, "Perl script", "Script / library"],
  [/Scrapy|PostmanRuntime|insomnia|HTTPie|RestSharp|Ruby|PHP\//i, "HTTP tool / scraper", "Script / library"],
];

function classify(ua: string, opts: { webdriver?: boolean } = {}): BotInfo {
  if (!ua || ua.length < 8) return { isBot: true, name: "Empty user-agent", category: "Scanner" };
  for (const [re, name, category] of R) if (re.test(ua)) return { isBot: true, name, category };
  if (opts.webdriver) return { isBot: true, name: "Automated browser (webdriver)", category: "Headless browser" };
  const m = ua.match(/([A-Za-z0-9._-]*(?:bot|crawler|spider|scraper|fetcher)[A-Za-z0-9._-]*)/i);
  if (m) return { isBot: true, name: m[1].slice(0, 40), category: "Other bot" };
  return { isBot: false, name: "", category: "" };
}

// ---- geo / ip (Vercel request header theke — kono package lage na) ----
const hdr = (r: Request, k: string) => r.headers.get(k) || "";
const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
const where = (r: Request) => ({
  country: hdr(r, "x-vercel-ip-country") || null,
  region: hdr(r, "x-vercel-ip-country-region") || null,
  city: dec(hdr(r, "x-vercel-ip-city")) || null,
});
const clientIp = (r: Request) => hdr(r, "x-real-ip") || hdr(r, "x-forwarded-for").split(",")[0].trim() || null;
async function sha(s: string, bytes = 12) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const WEEK = 7 * 86400000;
const J = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function cfg() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}
type C = { url: string; key: string };

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

  const ip = clientIp(req);
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
