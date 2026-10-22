import { useRef } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../lib/SettingsContext";
import CharacterScene from "./CharacterScene";

export default function Hero() {
  const { settings: s } = useSettings();
  const ref = useRef<HTMLElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <section className="hero" ref={ref} onPointerMove={onMove}>
      <div className="hero-word" aria-hidden>{s.alias.replace(/[^A-Za-z0-9 ]/g, "")}</div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{s.brand} · Portfolio</p>
          <h1>{s.alias}</h1>
          <p className="hero-name">{s.name}</p>
          <p className="hero-role">{s.role}</p>
          <p className="hero-tag">{s.tagline}</p>
          <div className="hero-actions">
            <Link to="/projects" className="btn btn-solid">View projects</Link>
            <a href="#contact" className="btn">Get in touch</a>
          </div>
        </div>
        <div className="hero-char">
          <CharacterScene cfg={s.character} />
        </div>
      </div>
      <div className="hero-scroll">scroll</div>
    </section>
  );
}
