// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)
/**
 * "Start a project" form. Server e validate + spam guard, tarpor Supabase e (service role) likha.
 * Guard: same-origin, bot block, honeypot, minimum fill time, ek network theke 24h e max 3 ta.
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

// ---- inquiry options (src/lib/inquiry.ts theke) ----
// Inquiry form er option gulo — client (form) ar server (api/inquiry.ts) duto jaygay ek-i list.
const SERVICES = ["Android app", "Desktop app", "Web app / website", "Redesign / rebrand", "Something else"] as const;
const BUDGETS = ["Under $500", "$500 – $2k", "$2k – $5k", "$5k+", "Not sure yet"] as const;
const TIMELINES = ["As soon as possible", "Within a month", "1 – 3 months", "Flexible"] as const;
const STATUSES = ["new", "contacted", "won", "lost"] as const;
// "What brings you here?" — ek-tap poll (kono personal data lage na)
const INTENTS = ["Hire a developer", "Need an app built", "Just browsing", "Collaboration", "Learning / inspiration"] as const;
// Ei duto intent ke lead score e extra point dei
const HOT_INTENTS: readonly string[] = ["Hire a developer", "Need an app built"];

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

// ---- Telegram notification (optional: env TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID) ----
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
async function tg(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 3800), parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch { /* notification fail korle kichu atkabe na */ }
}

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
