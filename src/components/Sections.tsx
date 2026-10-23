import { CSSProperties, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTrack } from "../lib/scrollEngine";
import { useSettings } from "../lib/SettingsContext";
import ProjectCard from "./ProjectCard";
import Reveal from "./Reveal";
import SplitText from "./SplitText";

const v = (o: Record<string, string | number>) => o as CSSProperties;

export function Label({ n, children }: { n: string; children: string }) {
  return <p className="label"><span>{n}</span>{children}</p>;
}

/** Section er pechone boro outline shobdo — scroll e dhire sore. */
function BgWord({ children }: { children: string }) {
  return <span className="bgword" aria-hidden>{children}</span>;
}

export function Ambient() {
  return <div className="ambient" aria-hidden><i /><i /><i /></div>;
}

/** Scroll-linked: scroll korle tag gulo cholte thake, thamle thame. */
export function Marquee() {
  const { settings: s } = useSettings();
  const tags = Array.from(new Set(s.skills.flatMap((k) => k.tags)));
  if (!tags.length) return null;
  const row = Array.from({ length: 8 }, () => tags).flat();
  return (
    <div className="marquee" aria-hidden>
      <div className="mrow a">{row.map((t, i) => <span key={i}>{t}</span>)}</div>
      <div className="mrow b">{row.map((t, i) => <span key={i}>{t}</span>)}</div>
    </div>
  );
}

/** Pinned: scroll korle shobdo gulo ekta ekta kore jole uthe. */
export function About() {
  const { settings: s, projects } = useSettings();
  const ref = useTrack<HTMLElement>("pin");
  let idx = 0;
  const paras = s.about.map((p) => p.split(" ").map((w) => ({ w, i: idx++ })));
  return (
    <section id="about" className="pin about" data-stage="about" ref={ref}>
      <div className="pin-inner">
        <BgWord>About</BgWord>
        <div className="wrap">
          <div className="about-box" style={v({ "--k": Math.max(1, idx) * 1.25 })}>
            <Label n="01">About</Label>
            <h2 className="big"><SplitText text="Solo builder." /><br /><em><SplitText text="Shipping real apps." delay={3} /></em></h2>
            <div className="lit-wrap">
              {paras.map((words, pi) => (
                <p className="lit" key={pi}>
                  {words.map(({ w, i }) => <span className="w" key={i} style={v({ "--i": i })}>{w} </span>)}
                </p>
              ))}
            </div>
            <div className="stats">
              <div><b>{projects.length}</b><span>Projects</span></div>
              <div><b>{s.skills.length}</b><span>Focus areas</span></div>
              <div><b>{1 + s.subBrands.length}</b><span>Brands</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Icon({ title }: { title: string }) {
  const t = title.toLowerCase();
  const p = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (/android|mobile|phone|app/.test(t))
    return <svg {...p}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>;
  if (/desktop|windows|mac|linux|electron/.test(t))
    return <svg {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;
  if (/web|backend|cloud|server|api/.test(t))
    return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>;
  return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>;
}

/** Stacking cards: ekta card arekta er upor diye uthe ashe. */
export function Skills() {
  const { settings: s } = useSettings();
  const secRef = useTrack<HTMLElement>("pass");
  const stackRef = useTrack<HTMLDivElement>("pin");
  return (
    <section id="skills" className="section skills" data-stage="skills" ref={secRef}>
      <BgWord>Craft</BgWord>
      <div className="wrap">
        <Label n="02">What I do</Label>
        <h2 className="big"><SplitText text="Three crafts," /><br /><em><SplitText text="one pair of hands." delay={2} /></em></h2>
        <div className="stack" ref={stackRef} style={v({ "--n": s.skills.length })}>
          {s.skills.map((k, i) => (
            <article className="scard" key={k.title} style={v({ "--i": i })}>
              <span className="snum">{String(i + 1).padStart(2, "0")}</span>
              <span className="sicon"><Icon title={k.title} /></span>
              <h3>{k.title}</h3>
              <p>{k.body}</p>
              <div className="tags">{k.tags.map((t) => <span key={t}>{t}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Line scroll er shathe ankhe, item gulo line pouchale ashe. */
export function Timeline() {
  const { settings: s } = useSettings();
  const ref = useTrack<HTMLElement>("pass");
  if (!s.timeline.length) return null;
  return (
    <section className="section journey" data-stage="journey" ref={ref}>
      <BgWord>Journey</BgWord>
      <div className="wrap">
        <div className="tl-box">
          <Label n="03">Journey</Label>
          <h2 className="big"><SplitText text="How it" /> <em><SplitText text="started." delay={2} /></em></h2>
          <div className="timeline">
            <div className="tl-line"><i /></div>
            {s.timeline.map((t, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="tl-item">
                  <span className="tl-when">{t.when}</span>
                  <div><h3>{t.title}</h3><p>{t.body}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Pinned horizontal: vertical scroll → project gulo pasher dike ber hoy. */
export function Work() {
  const { projects } = useSettings();
  const list = (projects.some((p) => p.featured) ? projects.filter((p) => p.featured) : projects).slice(0, 8);
  const ref = useTrack<HTMLElement>("pin");
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const calc = () => {
      const t = track.current, s = ref.current;
      if (!t || !s) return;
      const max = Math.max(0, t.scrollWidth - window.innerWidth + window.innerWidth * 0.06);
      s.style.setProperty("--max", String(Math.round(max)));
      s.style.height = `${window.innerHeight + max}px`;
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", calc);
    return () => { ro.disconnect(); window.removeEventListener("resize", calc); };
  }, [list.length, ref]);
  if (!list.length) return null;
  return (
    <section className="hpin" data-stage="work" ref={ref}>
      <div className="hpin-inner">
        <BgWord>Work</BgWord>
        <div className="wrap work-head">
          <Label n="04">Selected work</Label>
          <h2 className="big"><SplitText text="Things I've" /> <em><SplitText text="shipped." delay={2} /></em></h2>
        </div>
        <div className="htrack" ref={track}>
          {list.map((p, i) => <ProjectCard key={p.id} p={p} index={i + 1} />)}
          <Link to="/projects" className="pcard allcard" data-cursor="Open"><span>All projects</span><b>→</b></Link>
        </div>
        <div className="hbar"><i /></div>
      </div>
    </section>
  );
}

/** Brand hierarchy: parent brand → sub brand(s). Line scroll e ankhe. */
export function Studio() {
  const { settings: s } = useSettings();
  const ref = useTrack<HTMLElement>("pass");
  return (
    <section className="section studio" data-stage="studio" ref={ref}>
      <BgWord>{s.brand}</BgWord>
      <div className="wrap">
        <div className="studio-box">
          <Label n="05">The studio</Label>
          <div className="parent">
            <span className="parent-ring" aria-hidden />
            <h2 className="wordmark"><SplitText text={s.brand} by="char" /></h2>
            <p className="lead">{s.parentBody}</p>
          </div>
          <div className="branch" aria-hidden><i /></div>
          <div className="subs">
            {s.subBrands.map((b, i) => (
              <Reveal key={b.name} delay={i * 120}>
                <a className="sub" href={b.url || "#"} target="_blank" rel="noreferrer" data-cursor="Visit">
                  <span className="sub-tag">Brand of {s.brand}</span>
                  <h3>{b.name}</h3>
                  <p>{b.body}</p>
                  <b className="sub-arrow">↗</b>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { settings: s } = useSettings();
  const sub = s.subBrands[0]?.name ?? "";
  const unit = `${s.brand} · ${sub} · `.toUpperCase();
  const ring = unit.repeat(Math.max(1, Math.round(44 / unit.length)));
  return (
    <section id="contact" className="section contact" data-stage="contact">
      <div className="wrap">
        <Label n="06">Contact</Label>
        <p className="lead"><SplitText text="Have an app idea or want to work together?" /></p>
        <a className="mail" href={`mailto:${s.email}`} data-cursor="Email me"><SplitText text={s.email} by="char" /></a>
        <Reveal delay={200}>
          <div className="socials">
            {s.socials.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noreferrer">{x.label} ↗</a>)}
          </div>
        </Reveal>
        <a className="badge-rot" href={`mailto:${s.email}`} aria-label="Email me" data-cursor="Say hi">
          <svg viewBox="0 0 160 160">
            <defs><path id="circ" d="M80,80 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0" /></defs>
            <text><textPath href="#circ" textLength="385">{ring}</textPath></text>
          </svg>
          <span>↗</span>
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  const { settings: s } = useSettings();
  const sub = s.subBrands.map((b) => b.name).join(", ");
  return (
    <footer className="footer wrap">
      <span>© {new Date().getFullYear()} {s.brand} · {s.name} ({s.alias}){sub ? ` · ${sub} is a ${s.brand} brand` : ""}</span>
      <a href="#top" className="totop">Back to top ↑</a>
    </footer>
  );
}
