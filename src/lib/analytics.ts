import { useSyncExternalStore } from "react";
import { classify } from "./bots";
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase";

/**
 * First-party, anonymous analytics (Supabase e jomar). Cookie nai, IP save hoy na,
 * fingerprinting nai. Random visitor id localStorage e, session id sessionStorage e.
 * Location: /api/geo (Vercel) theke — desh/shohor, raw IP na. Bot (JS chalano) gulo `is_bot` diye record hoy.
 * Skip kore: Do-Not-Track, localhost, admin pages, ar jei browser e admin login hoyeche (nx_ignore).
 */

interface Cur { id: string; start: number; last: number; active: number; maxScroll: number }
let cur: Cur | null = null;
let timer = 0;
let wired = false;
const seen = new Set<string>();
let io: IntersectionObserver | null = null;
let pio: IntersectionObserver | null = null;
const firedProjects = new Set<string>();

let ipStored = false;
const ipSubs = new Set<() => void>();
function setIpStored(v: boolean) { if (v !== ipStored) { ipStored = v; ipSubs.forEach((f) => f()); } }
/** Footer notice: raw IP store hocche kina (server e STORE_RAW_IP=1 hole true). */
export const useIpStored = () => useSyncExternalStore((cb) => { ipSubs.add(cb); return () => { ipSubs.delete(cb); }; }, () => ipStored);
export const getSessionId = () => id(sessionStorage, "nx_sid");
export const getLinkCode = () => { try { return localStorage.getItem("nx_link") || ""; } catch { return ""; } };

/** Browser er anonymous visitor id (like er jonno o use hoy). */
export const getVisitorId = () => id(localStorage, "nx_vid");

export function trackingEnabled(): boolean {
  if (!SUPABASE_URL || !SUPABASE_KEY || typeof navigator === "undefined") return false;
  try { if (localStorage.getItem("nx_ignore") === "1") return false; } catch { /* ignore */ }
  if (/^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname)) {
    // local dev e default off; test korte URL e ?track=1 dao (session bhor mone thake)
    try { if (/[?&]track=1/.test(location.search)) sessionStorage.setItem("nx_force", "1"); } catch { /* ignore */ }
    let forced = false;
    try { forced = sessionStorage.getItem("nx_force") === "1"; } catch { /* ignore */ }
    if (!forced) return false;
  }
  return true;
}

/** Approx. location (country/region/city) + salted ip hash — session e ekbar. */
async function getGeo(): Promise<{ country?: string; region?: string; city?: string; ip_hash?: string; ip?: string }> {
  try {
    const c = sessionStorage.getItem("nx_geo");
    if (c) { const g = JSON.parse(c); setIpStored(!!g.ip); return g; }
  } catch { /* ignore */ }
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch("/api/geo", { cache: "no-store", signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return {};
    const j = await r.json();
    const g = { country: j.country ?? undefined, region: j.region ?? undefined, city: j.city ?? undefined, ip_hash: j.ip_hash ?? undefined, ip: j.ip ?? undefined };
    setIpStored(!!j.ip_stored);
    try { sessionStorage.setItem("nx_geo", JSON.stringify(g)); } catch { /* ignore */ }
    return g;
  } catch { return {}; }
}

function id(store: Storage, key: string) {
  try {
    let v = store.getItem(key);
    if (!v) { v = crypto.randomUUID(); store.setItem(key, v); }
    return v;
  } catch { return "anon"; }
}

function ua() {
  const u = navigator.userAgent;
  const w = Math.min(screen.width, screen.height);
  const device = /iPad|Tablet/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u)) ? "tablet" : /Mobi|iPhone|Android/i.test(u) || w < 560 ? "mobile" : "desktop";
  const browser = /Edg\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /SamsungBrowser/.test(u) ? "Samsung" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Other";
  const os = /Windows/.test(u) ? "Windows" : /Android/.test(u) ? "Android" : /iPhone|iPad|iPod/.test(u) ? "iOS" : /Mac OS X/.test(u) ? "macOS" : /Linux/.test(u) ? "Linux" : "Other";
  return { device, browser, os };
}

function send(path: string, body: unknown) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  }).catch(() => { /* analytics kokhono site break korbe na */ });
}

function accumulate() {
  if (!cur) return;
  const n = performance.now();
  if (document.visibilityState === "visible") cur.active += (n - cur.last) / 1000;
  cur.last = n;
}

function beat() {
  if (!cur) return;
  accumulate();
  send("rpc/track_heartbeat", { p_id: cur.id, p_duration: Math.round(cur.active), p_scroll: cur.maxScroll });
}

function onScroll() {
  if (!cur) return;
  const h = document.documentElement;
  const pct = Math.round(((window.scrollY + window.innerHeight) / Math.max(1, h.scrollHeight)) * 100);
  if (pct > cur.maxScroll) cur.maxScroll = Math.min(100, pct);
}

function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") beat();
    else if (cur) cur.last = performance.now();
  });
  window.addEventListener("pagehide", beat);
  document.addEventListener("click", onClick, true);
}

export function trackPageview(path: string) {
  if (cur) beat();
  clearInterval(timer);
  io?.disconnect();
  pio?.disconnect();
  seen.clear();
  firedProjects.clear();
  cur = null;
  if (!trackingEnabled() || path.startsWith("/admin")) return;
  const q = new URLSearchParams(location.search);
  let ref = "";
  try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch { /* ignore */ }
  if (ref === location.hostname) ref = "";
  const bot = classify(navigator.userAgent, { webdriver: (navigator as Navigator & { webdriver?: boolean }).webdriver });
  // manush visitor e Do-Not-Track mane chola; bot ra DNT mane na — tader log kora hoy
  if (!bot.isBot && navigator.doNotTrack === "1") return;

  // ?v=code — naamer tracking link (admin e banano); browser e mone rakhi
  let link = "";
  try {
    const v = q.get("v");
    if (v && /^[a-z0-9_-]{1,40}$/i.test(v)) localStorage.setItem("nx_link", v.toLowerCase());
    link = localStorage.getItem("nx_link") || "";
  } catch { /* ignore */ }

  const { device, browser, os } = ua();
  const vid = crypto.randomUUID();
  const base = {
    id: vid,
    visitor_id: id(localStorage, "nx_vid"),
    session_id: id(sessionStorage, "nx_sid"),
    path: path.slice(0, 200),
    referrer: ref.slice(0, 120) || null,
    utm_source: q.get("utm_source")?.slice(0, 60) || null,
    utm_medium: q.get("utm_medium")?.slice(0, 60) || null,
    utm_campaign: q.get("utm_campaign")?.slice(0, 60) || null,
    device, browser, os,
    screen: `${screen.width}x${screen.height}`,
    language: (navigator.language || "").slice(0, 20),
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || "").slice(0, 60),
    link_code: link || null,
    is_bot: bot.isBot,
    bot_name: bot.isBot ? bot.name : null,
    bot_category: bot.isBot ? bot.category : null,
    user_agent: bot.isBot ? navigator.userAgent.slice(0, 300) : null,
  };
  void getGeo().then((g) => send("visits", { ...base, ...g }));
  // naamer tracking link khulle (session e ekbar) Telegram ping — server e dedupe hoy
  if (link && !bot.isBot) {
    try {
      if (!sessionStorage.getItem("nx_notified")) {
        sessionStorage.setItem("nx_notified", "1");
        fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: link, sid: id(sessionStorage, "nx_sid") }) }).catch(() => {});
      }
    } catch { /* ignore */ }
  }
  if (bot.isBot) return; // bot er jonno heartbeat / event nai
  wire();
  cur = { id: vid, start: performance.now(), last: performance.now(), active: 0, maxScroll: 0 };
  onScroll();
  timer = window.setInterval(() => { if (document.visibilityState === "visible") beat(); }, 15000);
}

export function trackEvent(name: string, label?: string, url?: string) {
  if (!cur) return;
  send("events", {
    visitor_id: id(localStorage, "nx_vid"),
    session_id: id(sessionStorage, "nx_sid"),
    path: location.pathname.slice(0, 200),
    name: name.slice(0, 40),
    label: label?.slice(0, 120) ?? null,
    url: url?.slice(0, 300) ?? null,
  });
}

/** Kon section porjonto visitor pouchalo (har pageview e ekbar). */
export function observeSections() {
  if (!cur) return;
  io?.disconnect();
  io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      const k = (e.target as HTMLElement).dataset.stage!;
      if (e.isIntersecting && !seen.has(k)) { seen.add(k); trackEvent("section", k); }
    }),
    { rootMargin: "-45% 0px -45% 0px" }
  );
  document.querySelectorAll("[data-stage]").forEach((el) => io!.observe(el));
}

/** Kon project card e visitor 1.2s+ dhore chilo (60%+ visible) — kon project beshi attention pay. */
export function observeProjects() {
  if (!cur) return;
  pio?.disconnect();
  const timers = new Map<Element, number>();
  pio = new IntersectionObserver(
    (es) => es.forEach((e) => {
      const el = e.target as HTMLElement;
      const title = el.querySelector("h3")?.textContent?.trim() || "";
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        if (title && !firedProjects.has(title) && !timers.has(el))
          timers.set(el, window.setTimeout(() => { firedProjects.add(title); trackEvent("project_view", title); timers.delete(el); }, 1200));
      } else {
        const t = timers.get(el);
        if (t) { clearTimeout(t); timers.delete(el); }
      }
    }),
    { threshold: [0, 0.6, 1] }
  );
  document.querySelectorAll(".pcard:not(.allcard)").forEach((el) => pio!.observe(el));
}

function onClick(e: MouseEvent) {
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || !cur) return;
  const href = a.getAttribute("href") || "";
  const text = (a.textContent || "").trim().replace(/\s+/g, " ");
  if (href.startsWith("mailto:")) return trackEvent("email_click", href.slice(7));
  if (href.startsWith("tel:")) return trackEvent("call_click", href.slice(4));
  const card = a.closest(".pcard");
  if (card && /^https?:/.test(href)) return trackEvent("project_link", card.querySelector("h3")?.textContent || text, href);
  if (/^https?:/.test(href) && new URL(href).hostname !== location.hostname) return trackEvent("outbound_click", text || new URL(href).hostname, href);
  if (a.classList.contains("btn") || a.classList.contains("nav-cta")) return trackEvent("cta_click", text);
}
