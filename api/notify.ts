// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)
/**
 * Tumi je tracking link (?v=code) dile, keu seta prothom khulle Telegram e ping:
 * "Recruiter — Acme just opened your portfolio". Ek session e ekbar-i (events table e dedupe).
 * Telegram env na thakle kichu kore na.
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
