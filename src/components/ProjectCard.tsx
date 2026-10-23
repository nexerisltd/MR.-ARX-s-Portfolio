import type { Project } from "../lib/types";

export default function ProjectCard({ p }: { p: Project }) {
  return (
    <article
      className="pcard"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
    >
      <div className="pcard-img">
        {p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy" /> : <span>{p.title.slice(0, 1)}</span>}
      </div>
      <div className="pcard-body">
        <h3>{p.title}</h3>
        <p>{p.description}</p>
        <div className="tags">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="pcard-links">
          {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer">Live ↗</a>}
          {p.repo_url && <a href={p.repo_url} target="_blank" rel="noreferrer">Source ↗</a>}
        </div>
      </div>
    </article>
  );
}
