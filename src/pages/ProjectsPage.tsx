import { useMemo, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import { Footer } from "../components/Sections";
import { useSettings } from "../lib/SettingsContext";

export default function ProjectsPage() {
  const { projects, ready } = useSettings();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const tags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tech))).sort(), [projects]);
  const shown = projects.filter(
    (p) =>
      (!tag || p.tech.includes(tag)) &&
      (!q || `${p.title} ${p.description} ${p.tech.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <>
      <section className="section page-head">
        <div className="wrap">
          <p className="label"><span>—</span>Projects</p>
          <h1 className="big">Everything I've built<em>.</em></h1>
          <p className="lead">{projects.length} projects and counting.</p>
          <div className="filters">
            <input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="tags tagbar">
              <button className={!tag ? "on" : ""} onClick={() => setTag("")}>All</button>
              {tags.map((t) => (
                <button key={t} className={tag === t ? "on" : ""} onClick={() => setTag(t === tag ? "" : t)}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="wrap">
        <div className="pgrid">{shown.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
        {ready && !shown.length && <p className="lead empty">Kono project paoa jayni.</p>}
      </section>
      <Footer />
    </>
  );
}
