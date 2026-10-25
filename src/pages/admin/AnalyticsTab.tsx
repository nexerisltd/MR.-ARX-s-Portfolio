import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import Bots from "./analytics/Bots";
import { BotHit, Ev, fetchAll, groupVisitors, Inquiry, Like, LinkRow, Visit } from "./analytics/data";
import Links from "./analytics/Links";
import Overview, { R, RANGES } from "./analytics/Overview";
import Visitors from "./analytics/Visitors";

type Sub = "overview" | "visitors" | "bots" | "links";
const SUBS: [Sub, string][] = [["overview", "Overview"], ["visitors", "Visitors"], ["bots", "Bots"], ["links", "Tracking links"]];

export default function AnalyticsTab() {
  const [range, setRange] = useState<R>("7d");
  const [sub, setSub] = useState<Sub>("overview");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [hits, setHits] = useState<BotHit[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [inq, setInq] = useState<Inquiry[]>([]);
  const [v2, setV2] = useState(true); // bot_hits / track_links table ache kina
  const [showBots, setShowBots] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const since = new Date(Date.now() - RANGES[range] * 86400000).toISOString();
      const [v, e] = await Promise.all([fetchAll<Visit>("visits", since), fetchAll<Ev>("events", since)]);
      setVisits(v);
      setEvents(e);
      const [h, l, lk, iq] = await Promise.allSettled([
        fetchAll<BotHit>("bot_hits", since), fetchAll<Like>("likes", since), supabase!.from("track_links").select("*").order("created_at", { ascending: false }),
        supabase!.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setInq(iq.status === "fulfilled" && !iq.value.error ? ((iq.value.data ?? []) as Inquiry[]) : []);
      setHits(h.status === "fulfilled" ? h.value : []);
      setLikes(l.status === "fulfilled" ? l.value : []);
      const okLinks = lk.status === "fulfilled" && !lk.value.error;
      setLinks(okLinks ? ((lk.value as { data: LinkRow[] }).data ?? []) : []);
      setV2(h.status === "fulfilled" && okLinks);
    } catch (x) {
      const m = (x as { message?: string }).message ?? String(x);
      setErr(/does not exist|schema cache|relation/i.test(m) ? "SETUP" : m);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { void load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const humans = useMemo(() => visits.filter((v) => !v.is_bot), [visits]);
  const botVisits = useMemo(() => visits.filter((v) => v.is_bot), [visits]);
  const linkMap = useMemo(() => new Map(links.map((l) => [l.code, l.label])), [links]);
  const idents = useMemo(() => {
    const m = new Map<string, { name: string; email: string; n: number }>();
    inq.forEach((i) => { if (i.visitor_id) m.set(i.visitor_id, { name: i.name, email: i.email, n: (m.get(i.visitor_id)?.n ?? 0) + 1 }); });
    return m;
  }, [inq]);
  const rows = useMemo(() => groupVisitors(showBots ? visits : humans, events, likes, linkMap, idents), [showBots, visits, humans, events, likes, linkMap, idents]);

  if (err === "SETUP")
    return (
      <div className="panel wide">
        <h2>Analytics setup lagbe</h2>
        <p className="muted">Supabase SQL Editor e <code>supabase/analytics.sql</code> file ta ekbar run koro (age <code>schema.sql</code> run kora thakte hobe). Tarpor ei page refresh koro.</p>
      </div>
    );

  return (
    <div className="analytics">
      <div className="panel wide">
        <div className="row between">
          <h2>Visitors</h2>
          <div className="row">
            {(Object.keys(RANGES) as R[]).map((r) => <button key={r} className={`btn ${range === r ? "btn-solid" : ""}`} onClick={() => setRange(r)}>{r}</button>)}
            <button className="btn" onClick={load} disabled={loading}>{loading ? "…" : "Refresh"}</button>
          </div>
        </div>
        <div className="tabs subnav">
          {SUBS.map(([k, l]) => <button key={k} className={sub === k ? "on" : ""} onClick={() => setSub(k)}>{l}{k === "bots" && botVisits.length + hits.length ? ` (${botVisits.length + hits.length})` : ""}</button>)}
        </div>
        {err && <p className="err">{err}</p>}
        {!v2 && <p className="notice"><b>Upgrade lagbe:</b> notun feature (bot list, tracking link, location, likes) er jonno <code>supabase/analytics.sql</code> abar run koro (purano data jay na).</p>}
      </div>

      {sub === "overview" && <Overview humans={humans} events={events} likes={likes} botCount={botVisits.length + hits.length} range={range} onChanged={load} />}
      {sub === "visitors" && <Visitors rows={rows} events={events} likes={likes} showBots={showBots} setShowBots={setShowBots} botCount={botVisits.length} />}
      {sub === "bots" && <Bots visits={botVisits} hits={hits} serverReady={hits.length > 0} />}
      {sub === "links" && <Links links={links} visits={humans} reload={load} ready={v2} />}
    </div>
  );
}
