import { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTrack } from "../lib/scrollEngine";
import { useSettings } from "../lib/SettingsContext";
import CharacterScene from "./CharacterScene";
import SplitText from "./SplitText";

const d = (ms: number) => ({ "--d": ms } as CSSProperties);

export default function Hero({ embedded }: { embedded: boolean }) {
  const { settings: s } = useSettings();
  const ref = useTrack<HTMLElement>("exit");
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width) * 2 - 1));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height) * 2 - 1));
  };
  return (
    <section className="hero" id="top" data-stage="hero" ref={ref} onPointerMove={onMove}>
      <div className="hero-word" aria-hidden>{s.alias.replace(/[^A-Za-z0-9 ]/g, "")}</div>
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow rise" style={d(0)}>
            <span className="lockup"><b>{s.brand}</b>{s.subBrands[0] && <><i>›</i><em>{s.subBrands[0].name}</em></>}</span>
          </p>
          <h1><SplitText text={s.alias} by="char" eager delay={2} /></h1>
          <p className="hero-name rise" style={d(650)}>{s.name}</p>
          <p className="hero-role rise" style={d(800)}>{s.role}</p>
          <p className="hero-tag rise" style={d(950)}>{s.tagline}</p>
          <div className="hero-actions rise" style={d(1100)}>
            <Link to="/projects" className="btn btn-solid">View projects</Link>
            <a href="#contact" className="btn">Get in touch</a>
          </div>
        </div>
        <div className="hero-slot" data-stage-drag data-cursor="Drag">
          {embedded && <CharacterScene cfg={s.character} />}
        </div>
      </div>
      <div className="hero-scroll rise" style={d(1500)}><i />scroll</div>
    </section>
  );
}
