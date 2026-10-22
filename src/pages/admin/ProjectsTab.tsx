import { useState } from "react";
import { shrinkImage } from "../../lib/image";
import { supabase, uploadBlob } from "../../lib/supabase";
import { useSettings } from "../../lib/SettingsContext";
import type { Project } from "../../lib/types";

const blank = (sort: number): Project => ({
  id: "", title: "", description: "", tech: [], live_url: "", repo_url: "", image_url: null, featured: false, sort,
});

export default function ProjectsTab() {
  const { projects, reload } = useSettings();
  const [ed, setEd] = useState<Project | null>(null);
  const [techText, setTechText] = useState("");
  const [msg, setMsg] = useState("");
  const db = supabase!;

  const open = (p: Project) => { setEd(p); setTechText(p.tech.join(", ")); setMsg(""); };

  const save = async () => {
    if (!ed || !ed.title.trim()) return setMsg("Title dao");
    setMsg("Saving…");
    const row = {
      id: ed.id || crypto.randomUUID(),
      title: ed.title.trim(),
      description: ed.description,
      tech: techText.split(",").map((t) => t.trim()).filter(Boolean),
      live_url: ed.live_url || null,
      repo_url: ed.repo_url || null,
      image_url: ed.image_url,
      featured: ed.featured,
      sort: ed.sort,
    };
    const { error } = await db.from("projects").upsert(row);
    if (error) return setMsg("Error: " + error.message);
    await reload();
    setEd(null);
  };

  const del = async (p: Project) => {
    if (!confirm(`"${p.title}" delete korbe?`)) return;
    await db.from("projects").delete().eq("id", p.id);
    await reload();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const a = projects[i], b = projects[i + dir];
    if (!b) return;
    await db.from("projects").upsert([{ ...a, sort: b.sort === a.sort ? a.sort + dir : b.sort }, { ...b, sort: a.sort }]);
    await reload();
  };

  const pickImage = async (file?: File) => {
    if (!file || !ed) return;
    setMsg("Image upload hocche…");
    try {
      const { blob } = await shrinkImage(file, 1200, "image/webp", 0.85);
      const url = await uploadBlob(`projects/${Date.now()}.webp`, blob, "image/webp");
      setEd({ ...ed, image_url: url });
      setMsg("");
    } catch (e) { setMsg("Error: " + (e as Error).message); }
  };

  if (ed)
    return (
      <div className="panel wide">
        <h2>{ed.id ? "Edit project" : "New project"}</h2>
        <label>Title<input value={ed.title} onChange={(e) => setEd({ ...ed, title: e.target.value })} /></label>
        <label>Description<textarea rows={3} value={ed.description} onChange={(e) => setEd({ ...ed, description: e.target.value })} /></label>
        <label>Tech (comma diye)<input value={techText} onChange={(e) => setTechText(e.target.value)} /></label>
        <div className="grid2">
          <label>Live URL<input value={ed.live_url ?? ""} onChange={(e) => setEd({ ...ed, live_url: e.target.value })} /></label>
          <label>Source / Repo URL<input value={ed.repo_url ?? ""} onChange={(e) => setEd({ ...ed, repo_url: e.target.value })} /></label>
          <label>Order (choto number age)<input type="number" value={ed.sort} onChange={(e) => setEd({ ...ed, sort: parseInt(e.target.value) || 0 })} /></label>
          <label className="check"><input type="checkbox" checked={ed.featured} onChange={(e) => setEd({ ...ed, featured: e.target.checked })} /> Home page e featured</label>
        </div>
        <label>Cover image<input type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0])} /></label>
        {ed.image_url && <img className="thumb" src={ed.image_url} alt="" />}
        <div className="row">
          <button className="btn btn-solid" onClick={save}>Save</button>
          <button className="btn" onClick={() => setEd(null)}>Cancel</button>
          <span className="muted">{msg}</span>
        </div>
      </div>
    );

  return (
    <div className="panel wide">
      <div className="row between">
        <h2>Projects ({projects.length})</h2>
        <button className="btn btn-solid" onClick={() => open(blank((projects[projects.length - 1]?.sort ?? 0) + 1))}>+ Add project</button>
      </div>
      {projects.map((p, i) => (
        <div className="prow" key={p.id}>
          <div><strong>{p.title}</strong>{p.featured && <span className="badge">featured</span>}<p className="muted">{p.tech.join(" · ")}</p></div>
          <div className="row">
            <button className="btn" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button className="btn" onClick={() => move(i, 1)} disabled={i === projects.length - 1}>↓</button>
            <button className="btn" onClick={() => open(p)}>Edit</button>
            <button className="btn danger" onClick={() => del(p)}>Delete</button>
          </div>
        </div>
      ))}
      {!projects.length && <p className="muted">Ekhono kono project nai. "+ Add project" e click koro.</p>}
    </div>
  );
}
