import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { LinkRow, Visit, ago, place } from "./data";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "link";

export default function Links({ links, visits, reload, ready }: { links: LinkRow[]; visits: Visit[]; reload: () => void; ready: boolean }) {
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const base = `${location.origin}/`;

  const add = async () => {
    if (!label.trim()) return setMsg("Ekta naam dao (e.g. “Recruiter — Acme”)");
    const code = `${slug(label)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase!.from("track_links").insert({ code, label: label.trim(), note: note.trim() || null });
    if (error) return setMsg("Error: " + error.message);
    setLabel(""); setNote(""); setMsg("Link ready ✓ — copy kore pathao");
    reload();
  };
  const del = async (c: string) => {
    if (!confirm("Ei link delete korbe? (Purano visit gulo thakbe, shudhu naam ta chole jabe)")) return;
    await supabase!.from("track_links").delete().eq("code", c);
    reload();
  };
  const copy = async (c: string) => { try { await navigator.clipboard.writeText(`${base}?v=${c}`); setMsg("Copied ✓"); } catch { setMsg(`${base}?v=${c}`); } };

  return (
    <div className="panel wide">
      <h2>Tracking links</h2>
      <p className="muted">Ekjon ke link pathale se khulle tomar admin e <b>tar naam</b> shoho dekhabe. Jemon recruiter, client, friend er jonno alada link banao. Eta kono manush ke na-jaanie follow kore na — shudhu je link ta tumi nijei dile, shei link theke asha visit gulo chena jay.</p>
      {!ready && <p className="notice">Prothome <code>supabase/analytics.sql</code> (v2) run koro, tarpor ei feature kaj korbe.</p>}
      <div className="grid2">
        <label>Kar jonno? (label)<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Recruiter — Acme" /></label>
        <label>Note (optional)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="LinkedIn DM, 24 Oct" /></label>
      </div>
      <div className="row"><button className="btn btn-solid" onClick={add} disabled={!ready}>Create link</button><span className="muted">{msg}</span></div>

      <div className="an-table">
        {links.map((l) => {
          const vs = visits.filter((v) => v.link_code === l.code);
          const people = new Set(vs.map((v) => v.visitor_id)).size;
          const last = vs.length ? [...vs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] : null;
          return (
            <div className="ltr" key={l.code}>
              <div><b>{l.label}</b>{l.note && <em>{l.note}</em>}<code>{base}?v={l.code}</code></div>
              <div><b>{vs.length}</b><em>{people} visitor{people === 1 ? "" : "s"}</em></div>
              <div>{last ? <>{ago(last.created_at)}<em>{place(last)}</em></> : <span className="muted">not opened yet</span>}</div>
              <div className="row"><button className="btn" onClick={() => copy(l.code)}>Copy</button><button className="btn danger" onClick={() => del(l.code)}>Delete</button></div>
            </div>
          );
        })}
        {!links.length && <p className="muted pad">Ekhono kono tracking link nai.</p>}
      </div>
    </div>
  );
}
