import { useCallback, useEffect, useMemo, useState } from "react";
import { STATUSES } from "../../lib/inquiry";
import { supabase } from "../../lib/supabase";
import { ago, BarList, count, countryName, evText, Ev, flag, fmtT, Inquiry, place, Visit, when } from "./analytics/data";

export default function InquiriesTab() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [status, setStatus] = useState("all");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr("");
    const { data, error } = await supabase!.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return setErr(/does not exist|schema cache|relation/i.test(error.message) ? "SETUP" : error.message);
    const list = (data ?? []) as Inquiry[];
    setRows(list);
    const ids = [...new Set(list.map((i) => i.visitor_id).filter((x): x is string => !!x))].slice(0, 100);
    if (ids.length) {
      const [v, e] = await Promise.all([
        supabase!.from("visits").select("*").in("visitor_id", ids).order("created_at", { ascending: false }).limit(1000),
        supabase!.from("events").select("*").in("visitor_id", ids).order("created_at", { ascending: false }).limit(1000),
      ]);
      setVisits((v.data ?? []) as Visit[]);
      setEvents((e.data ?? []) as Ev[]);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const setSt = async (id: string, st: string) => { await supabase!.from("inquiries").update({ status: st }).eq("id", id); setRows((r) => r.map((x) => (x.id === id ? { ...x, status: st } : x))); };
  const del = async (id: string) => { if (!confirm("Ei inquiry delete korbe?")) return; await supabase!.from("inquiries").delete().eq("id", id); setRows((r) => r.filter((x) => x.id !== id)); };

  const stat = useMemo(() => {
    const src = (i: Inquiry) => {
      const vs = visits.filter((v) => v.visitor_id === i.visitor_id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const first = vs[vs.length - 1];
      return i.link_code ? `link:${i.link_code}` : first?.utm_source ? `utm:${first.utm_source}` : first?.referrer || "Direct";
    };
    return {
      services: count(rows.flatMap((r) => (r.services.length ? r.services : ["(not selected)"]))), budget: count(rows.map((r) => r.budget), "Not said"),
      timeline: count(rows.map((r) => r.timeline), "Not said"), countries: count(rows.map((r) => (r.country ? `${flag(r.country)} ${countryName(r.country)}` : "")), "Unknown"),
      source: count(rows.map(src), "Direct"), newCount: rows.filter((r) => r.status === "new").length, won: rows.filter((r) => r.status === "won").length,
    };
  }, [rows, visits]);

  if (err === "SETUP")
    return <div className="panel wide"><h2>Inquiries setup lagbe</h2><p className="muted"><code>supabase/analytics.sql</code> (latest) Supabase SQL Editor e run koro, tarpor refresh.</p></div>;

  const shown = rows.filter((r) => status === "all" || r.status === status);
  return (
    <div className="analytics">
      <div className="panel wide">
        <div className="row between">
          <h2>Inquiries</h2>
          <div className="row">
            {["all", ...STATUSES].map((s) => <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>{s}{s === "new" && stat.newCount ? ` (${stat.newCount})` : ""}</button>)}
            <button className="btn" onClick={load}>Refresh</button>
          </div>
        </div>
        {err && <p className="err">{err}</p>}
        <div className="kpis">
          <div className="kpi"><b>{rows.length}</b><span>Total inquiries</span></div>
          <div className="kpi live"><b>{stat.newCount}</b><span>New (unanswered)</span></div>
          <div className="kpi"><b>{stat.won}</b><span>Won</span></div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="an-grid">
          <BarList title="What clients ask for" rows={stat.services} total={rows.length} />
          <BarList title="Budget" rows={stat.budget} total={rows.length} />
          <BarList title="Timeline" rows={stat.timeline} total={rows.length} />
          <BarList title="Where they came from" rows={stat.source} total={rows.length} />
          <BarList title="Country" rows={stat.countries} total={rows.length} />
        </div>
      )}

      {shown.map((r) => {
        const vs = visits.filter((v) => v.visitor_id === r.visitor_id);
        const ev = events.filter((e) => e.visitor_id === r.visitor_id);
        const last = vs[0];
        const sections = [...new Set(ev.filter((e) => e.name === "section").map((e) => e.label))];
        return (
          <div className="panel wide inq-card" key={r.id}>
            <div className="row between">
              <div><h3 className="inq-name">{r.name}</h3><a href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your project")}`}>{r.email}</a> <span className="muted">· {when(r.created_at)} ({ago(r.created_at)})</span></div>
              <div className="row">
                <select value={r.status} onChange={(e) => setSt(r.id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <a className="btn btn-solid" href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your project")}`}>Reply</a>
                <button className="btn danger" onClick={() => del(r.id)}>Delete</button>
              </div>
            </div>
            <div className="tags">{r.services.map((s) => <span key={s}>{s}</span>)}{r.budget && <span>💰 {r.budget}</span>}{r.timeline && <span>⏱ {r.timeline}</span>}</div>
            <p className="inq-msg">{r.message}</p>
            <button className="btn" onClick={() => setOpen(open === r.id ? null : r.id)}>{open === r.id ? "Hide" : "Show"} what they did on your site</button>
            {open === r.id && (
              <div className="facts">
                <div><span>Location</span><b>{last ? place(last) : r.country ? `${flag(r.country)} ${r.city ? decodeURIComponent(r.city) + ", " : ""}${countryName(r.country)}` : "—"}</b></div>
                <div><span>IP address</span><b>{vs.find((v) => v.ip)?.ip || "not stored"}</b></div>
                <div><span>Device</span><b>{last ? `${last.device} · ${last.browser} · ${last.os}` : "—"}</b></div>
                <div><span>Time on site / visits</span><b>{vs.length ? `${fmtT(vs.reduce((a, v) => a + v.duration_s, 0))} · ${vs.length} visit${vs.length > 1 ? "s" : ""}` : "—"}</b></div>
                <div className="wide2"><span>Sections reached</span><b>{sections.join(" → ") || "—"}</b></div>
                <div className="wide2"><span>Pages & clicks</span><b>{[...new Set(vs.map((v) => v.path))].join(", ") || "—"}{ev.filter((e) => e.name !== "section").slice(0, 5).map((e) => ` · ${evText(e)}`).join("")}</b></div>
              </div>
            )}
          </div>
        );
      })}
      {!shown.length && <div className="panel wide"><p className="muted">Ekhono kono inquiry nai. Contact section er "Start a project" form theke message ashle ekhane dekhabe.</p></div>}
    </div>
  );
}
