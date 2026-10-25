import { supabase } from "../../../lib/supabase";

export interface Visit {
  id: string; created_at: string; last_seen: string; visitor_id: string; session_id: string; path: string;
  referrer: string | null; utm_source: string | null; utm_medium?: string | null; utm_campaign?: string | null;
  device: string | null; browser: string | null; os: string | null; screen: string | null; language: string | null; timezone: string | null;
  duration_s: number; max_scroll: number;
  country?: string | null; region?: string | null; city?: string | null; ip_hash?: string | null; ip?: string | null;
  is_bot?: boolean; bot_name?: string | null; bot_category?: string | null; user_agent?: string | null; link_code?: string | null;
}
export interface Ev { id: string; created_at: string; visitor_id: string | null; session_id: string | null; name: string; label: string | null; url: string | null }
export interface BotHit { id: string; created_at: string; path: string | null; user_agent: string | null; bot_name: string | null; bot_category: string | null; country: string | null; region: string | null; city: string | null; ip_hash: string | null }
export interface LinkRow { code: string; label: string; note: string | null; created_at: string }
export interface Inquiry {
  id: string; created_at: string; name: string; email: string; services: string[]; budget: string | null; timeline: string | null; message: string;
  visitor_id: string | null; session_id: string | null; link_code: string | null; ip_hash: string | null; country: string | null; city: string | null;
  status: string; note: string | null;
}
export interface Like { id: string; created_at: string; target: string; visitor_id: string | null }

export async function fetchAll<T>(table: string, since: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await supabase!.from(table).select("*").gte("created_at", since).order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    out.push(...((data ?? []) as unknown as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// ---------- formatting helpers ----------
export const flag = (cc?: string | null) =>
  cc && /^[A-Za-z]{2}$/.test(cc) ? String.fromCodePoint(...Array.from(cc.toUpperCase()).map((c) => 127397 + c.charCodeAt(0))) : "🌐";
const dn = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
export const countryName = (cc?: string | null) => (cc ? dn?.of(cc.toUpperCase()) ?? cc : "Unknown");
export const place = (v: { country?: string | null; city?: string | null; timezone?: string | null }) =>
  v.country ? `${flag(v.country)} ${v.city ? decodeURIComponent(v.city) + ", " : ""}${countryName(v.country)}` : v.timezone ? `🌐 ${v.timezone}` : "🌐 Unknown";
export const fmtT = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
export const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  return s < 60 ? "just now" : s < 3600 ? `${Math.floor(s / 60)}m ago` : s < 86400 ? `${Math.floor(s / 3600)}h ago` : `${Math.floor(s / 86400)}d ago`;
};
export const when = (iso: string) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const count = (items: (string | null | undefined)[], fallback = "Unknown") => {
  const m = new Map<string, number>();
  items.forEach((i) => { const k = i || fallback; m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

export function Avatar({ id, size = 34 }: { id: string; size?: number }) {
  return <span className="avatar" style={{ width: size, height: size, background: `hsl(${hue(id)} 45% 32%)`, borderColor: `hsl(${hue(id)} 55% 55%)` }}>{id.slice(0, 2).toUpperCase()}</span>;
}

export function BarList({ title, rows, total }: { title: string; rows: [string, number][]; total: number }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="an-card">
      <h4>{title}</h4>
      {rows.slice(0, 7).map(([k, n]) => (
        <div className="an-row" key={k}>
          <i style={{ width: `${(n / max) * 100}%` }} />
          <span title={k}>{k}</span>
          <b>{n}{total ? <em> {Math.round((n / total) * 100)}%</em> : null}</b>
        </div>
      ))}
      {!rows.length && <p className="muted">Ekhono data nai</p>}
    </div>
  );
}

// ---------- visitor grouping ----------
export interface VRow {
  id: string; code: string; label: string | null; visits: Visit[]; first: string; last: string; sessions: number; pageviews: number;
  time: number; scroll: number; country: string; region: string; city: string; device: string; browser: string; os: string;
  language: string; timezone: string; screen: string; source: string; lastPath: string; clicks: number; sections: string[];
  returning: boolean; live: boolean; likes: number; ipHash: string; ip: string; email: string; inquiries: number;
}

export function groupVisitors(visits: Visit[], events: Ev[], likes: Like[], links: Map<string, string>, idents: Map<string, { name: string; email: string; n: number }> = new Map()): VRow[] {
  const evBy = new Map<string, Ev[]>();
  events.forEach((e) => { if (e.visitor_id) { if (!evBy.has(e.visitor_id)) evBy.set(e.visitor_id, []); evBy.get(e.visitor_id)!.push(e); } });
  const lkBy = new Map<string, number>();
  likes.forEach((l) => { if (l.visitor_id) lkBy.set(l.visitor_id, (lkBy.get(l.visitor_id) ?? 0) + 1); });
  const by = new Map<string, Visit[]>();
  visits.forEach((v) => { if (!by.has(v.visitor_id)) by.set(v.visitor_id, []); by.get(v.visitor_id)!.push(v); });
  const rows: VRow[] = [];
  by.forEach((vs, id) => {
    vs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)); // latest first
    const latest = vs[0], oldest = vs[vs.length - 1];
    const withGeo = vs.find((v) => v.country) ?? latest;
    const ev = evBy.get(id) ?? [];
    const code = vs.find((v) => v.link_code)?.link_code ?? null;
    const src = (v: Visit) => (v.utm_source ? `utm:${v.utm_source}` : v.referrer || "");
    rows.push({
      id, code: `V-${id.replace(/-/g, "").slice(0, 5).toUpperCase()}`, label: idents.get(id)?.name ?? (code ? links.get(code) ?? `link:${code}` : null),
      visits: vs, first: oldest.created_at, last: latest.last_seen > latest.created_at ? latest.last_seen : latest.created_at,
      sessions: new Set(vs.map((v) => v.session_id)).size, pageviews: vs.length,
      time: vs.reduce((a, v) => a + v.duration_s, 0), scroll: Math.max(...vs.map((v) => v.max_scroll)),
      country: withGeo.country ?? "", region: withGeo.region ?? "", city: withGeo.city ?? "",
      device: latest.device ?? "", browser: latest.browser ?? "", os: latest.os ?? "", language: latest.language ?? "",
      timezone: latest.timezone ?? "", screen: latest.screen ?? "",
      source: (code && links.get(code)) || src(oldest) || "Direct", lastPath: latest.path,
      clicks: ev.filter((e) => e.name !== "section").length, sections: [...new Set(ev.filter((e) => e.name === "section").map((e) => e.label ?? ""))],
      returning: new Set(vs.map((v) => v.session_id)).size > 1,
      live: Date.now() - new Date(latest.last_seen).getTime() < 90000, likes: lkBy.get(id) ?? 0,
      ipHash: vs.find((v) => v.ip_hash)?.ip_hash ?? "", ip: vs.find((v) => v.ip)?.ip ?? "",
      email: idents.get(id)?.email ?? "", inquiries: idents.get(id)?.n ?? 0,
    });
  });
  return rows.sort((a, b) => (a.last < b.last ? 1 : -1));
}

export const evText = (e: Ev) =>
  e.name === "section" ? `Reached “${e.label}” section`
  : e.name === "email_click" ? `Clicked email ${e.label ?? ""}`
  : e.name === "project_link" ? `Opened project “${e.label ?? ""}”`
  : e.name === "outbound_click" ? `Clicked link “${e.label ?? ""}”`
  : e.name === "cta_click" ? `Clicked “${e.label ?? ""}”`
  : `${e.name.replace("_", " ")} ${e.label ?? ""}`;
