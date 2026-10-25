/**
 * Bot / crawler classifier — client (JS-chalano bot), middleware (non-JS bot) duto jaygay use hoy.
 * Pure function: kono DOM/Node API lagbe na.
 */
export type BotCategory =
  | "Search engine" | "AI crawler" | "Social preview" | "SEO tool"
  | "Monitoring" | "Script / library" | "Scanner" | "Headless browser" | "Other bot";

export interface BotInfo { isBot: boolean; name: string; category: BotCategory | "" }

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

export function classify(ua: string, opts: { webdriver?: boolean } = {}): BotInfo {
  if (!ua || ua.length < 8) return { isBot: true, name: "Empty user-agent", category: "Scanner" };
  for (const [re, name, category] of R) if (re.test(ua)) return { isBot: true, name, category };
  if (opts.webdriver) return { isBot: true, name: "Automated browser (webdriver)", category: "Headless browser" };
  const m = ua.match(/([A-Za-z0-9._-]*(?:bot|crawler|spider|scraper|fetcher)[A-Za-z0-9._-]*)/i);
  if (m) return { isBot: true, name: m[1].slice(0, 40), category: "Other bot" };
  return { isBot: false, name: "", category: "" };
}
