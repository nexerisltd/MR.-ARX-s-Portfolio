// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)
/**
 * Vercel Routing Middleware: JS na-chalano bot (Googlebot, GPTBot, curl, scanner...) server-side e
 * dhore Supabase `bot_hits` e likhe. Manush visitor der track client-side e hoy.
 *
 * ⚠️ Ei file e KONO `import` nai — ata ei jonno: Vercel middleware/api file gulo alada alada compile kore,
 * bundle kore na. Onno folder (src/…) theke import korle runtime e file khuje pay na → site 500 hoye jay.
 * Shared code (bot list) `npm run sync:server` diye niche inline kore deya hoy.
 */
export const config = { matcher: ["/((?!api/|assets/|character/|.*\\..*).*)"] };

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
