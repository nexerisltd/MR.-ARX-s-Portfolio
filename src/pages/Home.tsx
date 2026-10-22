import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import { About, Contact, Footer, Label, Skills, Timeline } from "../components/Sections";
import { useSettings } from "../lib/SettingsContext";

export default function Home() {
  const { projects } = useSettings();
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const list = featured.length ? featured : projects.slice(0, 4);
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Timeline />
      <section className="section">
        <div className="wrap">
          <Reveal>
            <Label n="04">Selected work</Label>
          </Reveal>
          <div className="pgrid">
            {list.map((p, i) => <Reveal key={p.id} delay={i * 80}><ProjectCard p={p} /></Reveal>)}
          </div>
          <Reveal><Link to="/projects" className="btn btn-solid all">All projects →</Link></Reveal>
        </div>
      </section>
      <Contact />
      <Footer />
    </>
  );
}
