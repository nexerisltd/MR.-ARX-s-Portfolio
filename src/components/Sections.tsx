import { useSettings } from "../lib/SettingsContext";
import Reveal from "./Reveal";

export function Label({ n, children }: { n: string; children: string }) {
  return <p className="label"><span>{n}</span>{children}</p>;
}

export function About() {
  const { settings: s } = useSettings();
  return (
    <section id="about" className="section">
      <div className="wrap two">
        <Reveal><Label n="01">About</Label><h2 className="big">Solo builder.<br /><em>Shipping real apps.</em></h2></Reveal>
        <Reveal delay={120}>{s.about.map((p, i) => <p className="lead" key={i}>{p}</p>)}</Reveal>
      </div>
    </section>
  );
}

export function Skills() {
  const { settings: s } = useSettings();
  return (
    <section id="skills" className="section">
      <div className="wrap">
        <Reveal><Label n="02">What I do</Label></Reveal>
        <div className="cards3">
          {s.skills.map((k, i) => (
            <Reveal key={k.title} delay={i * 90}>
              <div className="card">
                <h3>{k.title}</h3>
                <p>{k.body}</p>
                <div className="tags">{k.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Timeline() {
  const { settings: s } = useSettings();
  if (!s.timeline.length) return null;
  return (
    <section className="section">
      <div className="wrap">
        <Reveal><Label n="03">Journey</Label></Reveal>
        <div className="timeline">
          {s.timeline.map((t, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="tl-item">
                <span className="tl-when">{t.when}</span>
                <div><h3>{t.title}</h3><p>{t.body}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { settings: s } = useSettings();
  return (
    <section id="contact" className="section contact">
      <div className="wrap">
        <Reveal>
          <Label n="05">Contact</Label>
          <p className="lead">Have an app idea or want to work together?</p>
          <a className="mail" href={`mailto:${s.email}`}>{s.email}</a>
          <div className="socials">
            {s.socials.map((x) => <a key={x.url} href={x.url} target="_blank" rel="noreferrer">{x.label} ↗</a>)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const { settings: s } = useSettings();
  return (
    <footer className="footer wrap">
      <span>© {new Date().getFullYear()} {s.name} ({s.alias}) · {s.brand}</span>
    </footer>
  );
}
