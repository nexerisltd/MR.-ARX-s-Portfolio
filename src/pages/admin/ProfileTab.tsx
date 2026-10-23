import { useState } from "react";
import { useSettings } from "../../lib/SettingsContext";
import type { SiteSettings } from "../../lib/types";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const parts = (l: string) => l.split("|").map((x) => x.trim());

export default function ProfileTab() {
  const { settings, saveSettings } = useSettings();
  const [f, setF] = useState({
    brand: settings.brand,
    parentBody: settings.parentBody,
    subBrands: settings.subBrands.map((b) => `${b.name} | ${b.body} | ${b.url}`).join("\n"),
    name: settings.name,
    alias: settings.alias,
    role: settings.role,
    tagline: settings.tagline,
    email: settings.email,
    about: settings.about.join("\n\n"),
    socials: settings.socials.map((s) => `${s.label} | ${s.url}`).join("\n"),
    skills: settings.skills.map((s) => `${s.title} | ${s.body} | ${s.tags.join(", ")}`).join("\n"),
    timeline: settings.timeline.map((t) => `${t.when} | ${t.title} | ${t.body}`).join("\n"),
  });
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setMsg("Saving…");
    const next: SiteSettings = {
      ...settings,
      brand: f.brand, parentBody: f.parentBody, name: f.name, alias: f.alias, role: f.role, tagline: f.tagline, email: f.email,
      subBrands: lines(f.subBrands).map((l) => { const [name, body, url] = parts(l); return { name, body: body ?? "", url: url ?? "" }; }),
      about: f.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      socials: lines(f.socials).map((l) => { const [label, url] = parts(l); return { label, url: url ?? "" }; }),
      skills: lines(f.skills).map((l) => { const [title, body, tags] = parts(l); return { title, body: body ?? "", tags: (tags ?? "").split(",").map((t) => t.trim()).filter(Boolean) }; }),
      timeline: lines(f.timeline).map((l) => { const [when, title, body] = parts(l); return { when, title: title ?? "", body: body ?? "" }; }),
    };
    try { await saveSettings(next); setMsg("Saved ✓"); } catch (e) { setMsg("Error: " + (e as Error).message); }
  };

  return (
    <div className="panel wide">
      <h2>Profile & content</h2>
      <div className="grid2">
        <label>Parent brand (e.g. NexEris)<input value={f.brand} onChange={set("brand")} /></label>
        <label>Alias (hero te boro kore dekhabe)<input value={f.alias} onChange={set("alias")} /></label>
        <label>Full name<input value={f.name} onChange={set("name")} /></label>
        <label>Role<input value={f.role} onChange={set("role")} /></label>
        <label>Email<input value={f.email} onChange={set("email")} /></label>
      </div>
      <label>Parent brand description (Studio section e dekhabe)<textarea rows={2} value={f.parentBody} onChange={set("parentBody")} /></label>
      <label>Sub brands (ek line e ekta: <code>Name | Description | URL</code>) — jemon NexApp<textarea rows={3} value={f.subBrands} onChange={set("subBrands")} /></label>
      <label>Tagline<textarea rows={2} value={f.tagline} onChange={set("tagline")} /></label>
      <label>About (paragraph gulo faka line diye alada koro)<textarea rows={6} value={f.about} onChange={set("about")} /></label>
      <label>Social links (ek line e ekta: <code>Label | URL</code>)<textarea rows={3} value={f.socials} onChange={set("socials")} /></label>
      <label>Skills (<code>Title | Description | tag1, tag2</code>)<textarea rows={4} value={f.skills} onChange={set("skills")} /></label>
      <label>Journey (<code>When | Title | Description</code>)<textarea rows={4} value={f.timeline} onChange={set("timeline")} /></label>
      <div className="row"><button className="btn btn-solid" onClick={save}>Save</button><span className="muted">{msg}</span></div>
    </div>
  );
}
