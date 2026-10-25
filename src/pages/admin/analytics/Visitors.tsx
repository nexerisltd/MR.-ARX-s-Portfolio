import { useMemo, useState } from "react";
import { Avatar, countryName, evText, Ev, fmtT, flag, Like, place, VRow, when, ago, count, dec } from "./data";

type Sort = "last" | "visits" | "time" | "scroll";
const sel = (v: string) => (v === "all" ? "" : v);

function Drawer({ v, events, likes, onClose }: { v: VRow; events: Ev[]; likes: Like[]; onClose: () => void }) {
  const tl = useMemo(() => {
    const items: { t: string; text: string; kind: string }[] = [];
    v.visits.forEach((x) => items.push({ t: x.created_at, kind: "visit", text: `Visited ${x.path}${x.referrer ? ` · from ${x.referrer}` : ""}${x.duration_s ? ` · ${fmtT(x.duration_s)}` : ""} · ${x.max_scroll}% scrolled` }));
    events.filter((e) => e.visitor_id === v.id).forEach((e) => items.push({ t: e.created_at, kind: e.name === "section" ? "section" : "click", text: evText(e) }));
    likes.filter((l) => l.visitor_id === v.id).forEach((l) => items.push({ t: l.created_at, kind: "like", text: `Liked ${l.target === "site" ? "the site" : l.target.replace("project:", "project ")} ♥` }));
    return items.sort((a, b) => (a.t < b.t ? 1 : -1));
  }, [v, events, likes]);
  return (
    <>
      <div className="drawer-bg" onClick={onClose} />
      <aside className="drawer">
        <button className="btn drawer-x" onClick={onClose}>Close ✕</button>
        <div className="drawer-head">
          <Avatar id={v.code.slice(2)} size={52} />
          <div>
            <h3>{v.label ?? v.code}</h3>
            <p className="muted">{v.label ? `${v.code} · ` : ""}{place(v)}</p>
          </div>
        </div>
        <div className="facts">
          <div><span>Device</span><b>{v.device} · {v.browser} · {v.os}</b></div>
          <div><span>Screen</span><b>{v.screen || "—"}</b></div>
          <div><span>Language</span><b>{v.language || "—"}</b></div>
          <div><span>Timezone</span><b>{v.timezone || "—"}</b></div>
          <div><span>First seen</span><b>{when(v.first)}</b></div>
          <div><span>Last seen</span><b>{when(v.last)} ({ago(v.last)})</b></div>
          <div><span>Sessions / views</span><b>{v.sessions} / {v.pageviews}</b></div>
          <div><span>Total time</span><b>{v.time ? fmtT(v.time) : "—"}</b></div>
          <div><span>Came from</span><b>{v.source}</b></div>
          {v.email && <div className="wide2"><span>Name / email (from form)</span><b>{v.label} · <a href={`mailto:${v.email}`}>{v.email}</a></b></div>}
          <div><span>IP address</span><b>{v.ip || "not stored"}</b></div>
          <div><span>Network id (hash)</span><b title="Salted hash">{v.ipHash || "—"}</b></div>
        </div>
        <h4 className="an-h">Activity</h4>
        <div className="timeline-a">
          {tl.map((x, i) => <div key={i} className={`tla k-${x.kind}`}><i /><span>{when(x.t)}</span><p>{x.text}</p></div>)}
        </div>
      </aside>
    </>
  );
}

export default function Visitors({ rows, events, likes, showBots, setShowBots, botCount }: { rows: VRow[]; events: Ev[]; likes: Like[]; showBots: boolean; setShowBots: (b: boolean) => void; botCount: number }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");
  const [device, setDevice] = useState("all");
  const [browser, setBrowser] = useState("all");
  const [os, setOs] = useState("all");
  const [source, setSource] = useState("all");
  const [kind, setKind] = useState("all");
  const [has, setHas] = useState("all");
  const [sort, setSort] = useState<Sort>("last");
  const [open, setOpen] = useState<VRow | null>(null);

  const opts = (f: (r: VRow) => string, fb = "Unknown") => count(rows.map(f), fb);
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = rows.filter((r) =>
      (!sel(country) || r.country === sel(country)) && (!sel(device) || r.device === sel(device)) && (!sel(browser) || r.browser === sel(browser)) &&
      (!sel(os) || r.os === sel(os)) && (!sel(source) || r.source === sel(source)) &&
      (kind === "all" || (kind === "returning" ? r.returning : !r.returning)) &&
      (has === "all" || (has === "clicked" ? r.clicks > 0 : has === "contact" ? r.sections.includes("contact") : has === "liked" ? r.likes > 0 : has === "link" ? !!r.label : has === "inquiry" ? !!r.email : r.live)) &&
      (!ql || `${r.code} ${r.label ?? ""} ${r.email} ${r.ip} ${r.city} ${countryName(r.country)} ${r.country} ${r.source} ${r.lastPath} ${r.browser} ${r.os}`.toLowerCase().includes(ql))
    );
    const key: Record<Sort, (r: VRow) => number | string> = { last: (r) => r.last, visits: (r) => r.pageviews, time: (r) => r.time, scroll: (r) => r.scroll };
    return [...list].sort((a, b) => (key[sort](a) < key[sort](b) ? 1 : -1));
  }, [rows, q, country, device, browser, os, source, kind, has, sort]);

  const live = rows.filter((r) => r.live);
  const reset = () => { setQ(""); setCountry("all"); setDevice("all"); setBrowser("all"); setOs("all"); setSource("all"); setKind("all"); setHas("all"); };
  const csv = () => {
    const head = ["visitor", "name", "email", "ip", "country", "city", "device", "browser", "os", "sessions", "pageviews", "time_s", "max_scroll", "source", "first_seen", "last_seen", "clicks", "sections", "likes"];
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const body = filtered.map((r) => [r.code, r.label, r.email, r.ip, r.country, r.city, r.device, r.browser, r.os, r.sessions, r.pageviews, r.time, r.scroll, r.source, r.first, r.last, r.clicks, r.sections.join("|"), r.likes].map(esc).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    a.download = `visitors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const Select = ({ v, set, label, o }: { v: string; set: (s: string) => void; label: string; o: [string, number][] }) => (
    <select value={v} onChange={(e) => set(e.target.value)} aria-label={label}>
      <option value="all">{label}: all</option>
      {o.map(([k, n]) => <option key={k} value={k}>{label === "Country" ? `${flag(k)} ${countryName(k)}` : k} ({n})</option>)}
    </select>
  );

  return (
    <div className="panel wide">
      <div className="live-strip">
        <span className="live-dot"><i className="pulse" /> {live.length} online now</span>
        {live.slice(0, 6).map((r) => (
          <button key={r.id} className="chip" onClick={() => setOpen(r)} title={r.lastPath}>{flag(r.country)} {r.city ? dec(r.city) : r.code} · {r.device}</button>
        ))}
      </div>

      <div className="filters-bar">
        <input placeholder="Search visitor, city, country, page, source…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select v={country} set={setCountry} label="Country" o={opts((r) => r.country, "")} />
        <Select v={device} set={setDevice} label="Device" o={opts((r) => r.device)} />
        <Select v={browser} set={setBrowser} label="Browser" o={opts((r) => r.browser)} />
        <Select v={os} set={setOs} label="OS" o={opts((r) => r.os)} />
        <Select v={source} set={setSource} label="Source" o={opts((r) => r.source)} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="New / returning">
          <option value="all">New + returning</option><option value="new">New only</option><option value="returning">Returning only</option>
        </select>
        <select value={has} onChange={(e) => setHas(e.target.value)} aria-label="Activity">
          <option value="all">Any activity</option><option value="live">Online now</option><option value="clicked">Clicked something</option>
          <option value="contact">Reached Contact</option><option value="liked">Liked</option><option value="link">From a tracking link</option><option value="inquiry">Sent an inquiry</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="last">Sort: last seen</option><option value="visits">Sort: most visits</option><option value="time">Sort: most time</option><option value="scroll">Sort: deepest scroll</option>
        </select>
      </div>
      <div className="row between">
        <p className="muted">{filtered.length} of {rows.length} visitors{!showBots && botCount ? ` · ${botCount} bot visits hidden` : ""}</p>
        <div className="row">
          <label className="check-inline"><input type="checkbox" checked={showBots} onChange={(e) => setShowBots(e.target.checked)} /> Include bots</label>
          <button className="btn" onClick={reset}>Reset filters</button>
          <button className="btn" onClick={csv}>Export CSV</button>
        </div>
      </div>

      <div className="an-table">
        <div className="vth"><span>Visitor</span><span>Location</span><span>Device</span><span>Visits</span><span>Time</span><span>Source</span><span>Last seen</span></div>
        {filtered.slice(0, 200).map((r) => (
          <button className="vtr" key={r.id} onClick={() => setOpen(r)}>
            <span className="vcell"><Avatar id={r.code.slice(2)} />
              <span><b>{r.label ?? r.code}</b>
                <em>{r.live ? <span className="badge live">● online</span> : null}{r.returning ? <span className="badge">returning</span> : <span className="badge dim">new</span>}{r.email ? <span className="badge link">✉ inquiry</span> : r.label ? <span className="badge link">link</span> : null}{r.clicks ? <span className="badge">{r.clicks} click{r.clicks > 1 ? "s" : ""}</span> : null}{r.likes ? <span className="badge heart">♥</span> : null}</em>
              </span>
            </span>
            <span>{place(r)}</span>
            <span>{r.device} · {r.browser}<em>{r.os}</em></span>
            <span>{r.pageviews}<em>{r.sessions} session{r.sessions > 1 ? "s" : ""}</em></span>
            <span>{r.time ? fmtT(r.time) : "—"}<em>{r.scroll}% scroll</em></span>
            <span title={r.source}>{r.source}</span>
            <span>{ago(r.last)}</span>
          </button>
        ))}
        {!filtered.length && <p className="muted pad">Kono visitor pawa jayni. Filter ba date range bodle dekho.</p>}
      </div>
      {open && <Drawer v={open} events={events} likes={likes} onClose={() => setOpen(null)} />}
    </div>
  );
}
