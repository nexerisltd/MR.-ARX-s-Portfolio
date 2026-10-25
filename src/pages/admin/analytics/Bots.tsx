import { useMemo, useState } from "react";
import { BarList, BotHit, count, flag, Visit, ago, countryName } from "./data";

interface Item { t: string; name: string; cat: string; path: string; country: string; city: string; ua: string; via: "browser" | "server" }

export default function Bots({ visits, hits, serverReady }: { visits: Visit[]; hits: BotHit[]; serverReady: boolean }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const items: Item[] = useMemo(() => [
    ...visits.filter((v) => v.is_bot).map((v): Item => ({ t: v.created_at, name: v.bot_name || "Bot", cat: v.bot_category || "Other bot", path: v.path, country: v.country || "", city: v.city || "", ua: v.user_agent || "", via: "browser" })),
    ...hits.map((h): Item => ({ t: h.created_at, name: h.bot_name || "Bot", cat: h.bot_category || "Other bot", path: h.path || "/", country: h.country || "", city: h.city || "", ua: h.user_agent || "", via: "server" })),
  ].sort((a, b) => (a.t < b.t ? 1 : -1)), [visits, hits]);

  const cats = count(items.map((i) => i.cat));
  const filtered = items.filter((i) => (cat === "all" || i.cat === cat) && (!q || `${i.name} ${i.cat} ${i.ua} ${i.path}`.toLowerCase().includes(q.toLowerCase())));
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; cat: string; n: number; last: string; countries: Set<string>; paths: Map<string, number>; ua: string }>();
    filtered.forEach((i) => {
      const g = m.get(i.name) ?? { name: i.name, cat: i.cat, n: 0, last: i.t, countries: new Set<string>(), paths: new Map<string, number>(), ua: i.ua };
      g.n++; if (i.t > g.last) g.last = i.t; if (i.country) g.countries.add(i.country);
      g.paths.set(i.path, (g.paths.get(i.path) ?? 0) + 1); if (!g.ua) g.ua = i.ua;
      m.set(i.name, g);
    });
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [filtered]);

  return (
    <div className="analytics">
      <div className="panel wide">
        <div className="row between">
          <h2>Bots & crawlers</h2>
          <div className="kpis" style={{ margin: 0 }}>
            <div className="kpi"><b>{items.length}</b><span>Bot hits</span></div>
            <div className="kpi"><b>{groups.length}</b><span>Different bots</span></div>
            <div className="kpi"><b>{items.filter((i) => i.via === "server").length}</b><span>Server-seen</span></div>
          </div>
        </div>
        {!serverReady && <p className="notice">Non-JS bot (Googlebot, GPTBot, curl, scanner…) dhorte server-side logging lagbe: <code>middleware.ts</code> Vercel e deploy hole ar <code>analytics.sql</code> (v2) run kora thakle ekhane auto ashbe. Ekhon shudhu JavaScript-chalano bot dekha jacche.</p>}
        <div className="chips">
          <button className={`chip ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>All ({items.length})</button>
          {cats.map(([c, n]) => <button key={c} className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c} ({n})</button>)}
        </div>
        <div className="filters-bar"><input placeholder="Search bot name, user-agent, page…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>

      <div className="an-grid">
        <BarList title="By category" rows={cats} total={items.length} />
        <BarList title="Top bots" rows={groups.map((g) => [g.name, g.n] as [string, number])} total={items.length} />
        <BarList title="Bot countries" rows={count(items.map((i) => i.country ? `${flag(i.country)} ${countryName(i.country)}` : ""), "Unknown")} total={items.length} />
      </div>

      <div className="panel wide">
        <h3 className="sub">Bots visiting you</h3>
        <div className="an-table">
          <div className="bth"><span>Bot</span><span>Category</span><span>Hits</span><span>Last seen</span><span>From</span><span>Top page</span></div>
          {groups.map((g) => (
            <div className="btr" key={g.name} title={g.ua}>
              <span><b>{g.name}</b><em>{g.ua.slice(0, 70)}</em></span>
              <span><span className={`badge cat-${g.cat.replace(/[^a-z]/gi, "").toLowerCase()}`}>{g.cat}</span></span>
              <span>{g.n}</span><span>{ago(g.last)}</span>
              <span>{[...g.countries].slice(0, 3).map((c) => flag(c)).join(" ") || "—"}</span>
              <span>{[...g.paths.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]}</span>
            </div>
          ))}
          {!groups.length && <p className="muted pad">Ei range e kono bot visit nai.</p>}
        </div>
      </div>

      <div className="panel wide">
        <h3 className="sub">Latest bot hits</h3>
        <div className="an-table">
          {filtered.slice(0, 40).map((i, k) => (
            <div className="btr2" key={k}>
              <span>{ago(i.t)}</span><span><b>{i.name}</b></span><span>{i.path}</span>
              <span>{i.country ? `${flag(i.country)} ${i.city ? decodeURIComponent(i.city) : countryName(i.country)}` : "—"}</span>
              <span className="muted">{i.via === "server" ? "server" : "browser"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
