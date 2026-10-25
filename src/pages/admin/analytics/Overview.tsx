import { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { BarList, count, countryName, Ev, flag, fmtT, Like, Visit, dec } from "./data";

export const RANGES = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 } as const;
export type R = keyof typeof RANGES;
const SECTIONS = ["hero", "about", "skills", "journey", "work", "studio", "contact"];

export default function Overview({ humans, events, likes, botCount, range, onChanged }: { humans: Visit[]; events: Ev[]; likes: Like[]; botCount: number; range: R; onChanged: () => void }) {
  const [ignored, setIgnored] = useState(() => { try { return localStorage.getItem("nx_ignore") === "1"; } catch { return false; } });
  const visits = humans;

  const d = useMemo(() => {
    const visitors = new Set(visits.map((v) => v.visitor_id));
    const sessions = new Set(visits.map((v) => v.session_id));
    const per = new Map<string, Set<string>>();
    visits.forEach((v) => { if (!per.has(v.visitor_id)) per.set(v.visitor_id, new Set()); per.get(v.visitor_id)!.add(v.session_id); });
    const returning = [...per.values()].filter((s) => s.size > 1).length;
    const timed = visits.filter((v) => v.duration_s > 0);
    const avg = timed.length ? timed.reduce((a, v) => a + v.duration_s, 0) / timed.length : 0;
    const live = new Set(visits.filter((v) => Date.now() - new Date(v.last_seen).getTime() < 60000).map((v) => v.visitor_id)).size;

    const hourly = range === "24h";
    const n = hourly ? 24 : RANGES[range];
    const keyOf = (t: Date) => (hourly ? `${t.toLocaleDateString("en-CA")} ${String(t.getHours()).padStart(2, "0")}` : t.toLocaleDateString("en-CA"));
    const keys: string[] = [];
    for (let i = n - 1; i >= 0; i--) keys.push(keyOf(new Date(Date.now() - i * (hourly ? 3600000 : 86400000))));
    const views = new Map<string, number>(), uniq = new Map<string, Set<string>>();
    visits.forEach((v) => {
      const k = keyOf(new Date(v.created_at));
      views.set(k, (views.get(k) ?? 0) + 1);
      if (!uniq.has(k)) uniq.set(k, new Set());
      uniq.get(k)!.add(v.visitor_id);
    });
    const series = keys.map((k) => ({ k, views: views.get(k) ?? 0, vis: uniq.get(k)?.size ?? 0 }));

    const home = new Set(visits.filter((v) => v.path === "/").map((v) => v.session_id));
    const reached = (s: string) => new Set(events.filter((e) => e.name === "section" && e.label === s).map((e) => e.session_id)).size;
    const funnel = SECTIONS.map((s) => [s, s === "hero" ? home.size : reached(s)] as [string, number]);
    const cc = (v: Visit) => (v.country ? `${flag(v.country)} ${countryName(v.country)}` : v.timezone ? `🌐 ${v.timezone}` : "");
    return {
      visitors: visitors.size, sessions: sessions.size, returning, avg, live, series, funnel, home: home.size,
      scroll: visits.length ? Math.round(visits.reduce((a, v) => a + v.max_scroll, 0) / visits.length) : 0,
      pages: count(visits.map((v) => v.path)), refs: count(visits.map((v) => v.referrer), "Direct / none"),
      utm: count(visits.filter((v) => v.utm_source).map((v) => v.utm_source)),
      countries: count(visits.map(cc), "Unknown"), cities: count(visits.filter((v) => v.city).map((v) => `${flag(v.country)} ${dec(v.city!)}`)),
      devices: count(visits.map((v) => v.device)), browsers: count(visits.map((v) => v.browser)), oses: count(visits.map((v) => v.os)),
      langs: count(visits.map((v) => v.language)),
      clicks: count(events.filter((e) => e.name !== "section").map((e) => `${e.name.replace("_", " ")} · ${e.label ?? ""}`)),
      liked: count(likes.map((l) => (l.target === "site" ? "♥ Site" : `♥ ${l.target.replace("project:", "Project ")}`))),
    };
  }, [visits, events, likes, range]);

  const toggleIgnore = () => {
    try { if (ignored) localStorage.removeItem("nx_ignore"); else localStorage.setItem("nx_ignore", "1"); } catch { /* ignore */ }
    setIgnored(!ignored);
  };
  const [ipMsg, setIpMsg] = useState("");
  const withIp = visits.filter((v) => v.ip).length;
  const purgeIp = async (olderThanDays: number) => {
    if (!confirm(olderThanDays ? `${olderThanDays} diner purano shob stored IP muchbe?` : "Shob stored IP address muchbe? (country/city/hash thakbe)")) return;
    const cutoff = new Date(Date.now() - olderThanDays * 86400000).toISOString();
    for (const t of ["visits", "bot_hits"]) {
      const q = supabase!.from(t).update({ ip: null }).not("ip", "is", null);
      const { error } = await (olderThanDays ? q.lt("created_at", cutoff) : q);
      if (error) return setIpMsg("Error: " + error.message + " — analytics.sql (v2) run koro");
    }
    setIpMsg("Done ✓"); onChanged();
  };
  const clearAll = async () => {
    if (!confirm("Shob analytics data (visits, events, bot hits, likes) delete korbe? Eta ferot ashbe na.")) return;
    for (const t of ["events", "visits", "bot_hits", "likes"]) await supabase!.from(t).delete().gte("created_at", "2000-01-01");
    onChanged();
  };

  const maxV = Math.max(1, ...d.series.map((s) => s.views));
  const W = 640, Hh = 150, bw = W / d.series.length;
  return (
    <div className="analytics">
      <div className="panel wide">
        <div className="kpis">
          <div className="kpi live"><b>{d.live}</b><span><i className="pulse" /> Live now</span></div>
          <div className="kpi"><b>{visits.length}</b><span>Page views</span></div>
          <div className="kpi"><b>{d.visitors}</b><span>Unique visitors</span></div>
          <div className="kpi"><b>{d.sessions}</b><span>Sessions</span></div>
          <div className="kpi"><b>{d.returning}</b><span>Returning</span></div>
          <div className="kpi"><b>{fmtT(d.avg)}</b><span>Avg time on page</span></div>
          <div className="kpi"><b>{d.scroll}%</b><span>Avg scroll depth</span></div>
          <div className="kpi"><b>{likes.length}</b><span>♥ Likes</span></div>
          <div className="kpi"><b>{botCount}</b><span>Bot hits</span></div>
        </div>
        <div className="an-chart">
          <svg viewBox={`0 0 ${W} ${Hh + 22}`} preserveAspectRatio="none">
            {d.series.map((s, i) => (
              <g key={s.k}>
                <title>{`${s.k}: ${s.views} views, ${s.vis} visitors`}</title>
                <rect x={i * bw + bw * 0.12} y={Hh - (s.views / maxV) * Hh} width={bw * 0.76} height={(s.views / maxV) * Hh} rx="3" fill="rgba(217,161,91,.28)" />
                <rect x={i * bw + bw * 0.12} y={Hh - (s.vis / maxV) * Hh} width={bw * 0.76} height={(s.vis / maxV) * Hh} rx="3" fill="#d9a15b" />
              </g>
            ))}
            <text x="0" y={Hh + 16} fill="#9a9189" fontSize="11">{d.series[0]?.k.slice(5)}</text>
            <text x={W} y={Hh + 16} fill="#9a9189" fontSize="11" textAnchor="end">{d.series[d.series.length - 1]?.k.slice(5)}</text>
          </svg>
          <p className="muted"><i className="sw a" /> Page views <i className="sw b" /> Unique visitors</p>
        </div>
      </div>

      <div className="an-grid">
        <BarList title="Countries" rows={d.countries} total={visits.length} />
        <BarList title="Cities" rows={d.cities} total={visits.length} />
        <BarList title="Top pages" rows={d.pages} total={visits.length} />
        <BarList title="Where from (referrer)" rows={d.refs} total={visits.length} />
        <BarList title="Campaign (utm_source)" rows={d.utm} total={0} />
        <BarList title="Device" rows={d.devices} total={visits.length} />
        <BarList title="Browser" rows={d.browsers} total={visits.length} />
        <BarList title="Operating system" rows={d.oses} total={visits.length} />
        <BarList title="Language" rows={d.langs} total={visits.length} />
        <BarList title="Clicks" rows={d.clicks} total={0} />
        <BarList title="Likes" rows={d.liked} total={0} />
      </div>

      <div className="panel wide">
        <h3 className="sub">How far visitors scroll (home page)</h3>
        {d.funnel.map(([s, n]) => (
          <div className="an-row" key={s}>
            <i style={{ width: `${d.home ? Math.min(100, (n / d.home) * 100) : 0}%` }} />
            <span style={{ textTransform: "capitalize" }}>{s}</span>
            <b>{n}<em> {d.home ? Math.round((n / d.home) * 100) : 0}%</em></b>
          </div>
        ))}
      </div>

      <div className="panel wide">
        <h3 className="sub">Privacy & settings</h3>
        <p className="muted">Cookie nai. Location Vercel er IP-geo theke (desh/shohor, approximate). Naam/email shudhu tokhon ashe jokhon keu nijei "Start a project" form fill kore ba tomar dewa tracking link kholo. Human visitor e Do-Not-Track, localhost ar admin page track hoy na.</p>
        <p className="muted"><b>Raw IP:</b> {withIp ? `${withIp} visit e IP stored ache.` : "ekhon kono IP stored nai."} Default e off; Vercel env e <code>STORE_RAW_IP=1</code> dile on hoy (site er footer e auto notice dekhay). Cleanup: <button className="btn" onClick={() => purgeIp(90)}>90 diner purano IP muchho</button> <button className="btn danger" onClick={() => purgeIp(0)}>Shob IP muchho</button> <span>{ipMsg}</span></p>
        <div className="row">
          <button className="btn" onClick={toggleIgnore}>{ignored ? "✓ Ei browser track hoy na — chalu korbo" : "Ei browser track kora bondho koro"}</button>
          <button className="btn danger" onClick={clearAll}>Shob analytics data delete</button>
        </div>
      </div>
    </div>
  );
}
