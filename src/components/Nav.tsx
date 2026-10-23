import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSettings } from "../lib/SettingsContext";

export default function Nav() {
  const { settings: s } = useSettings();
  const { pathname } = useLocation();
  const home = pathname === "/";
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("");
  const a = (hash: string) => (home ? hash : `/${hash}`);

  // scroll progress bar
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [pathname]);

  // kon section e achi — nav link highlight
  useEffect(() => {
    setActive(pathname === "/projects" ? "projects" : "");
    if (!home) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ["about", "skills", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [home, pathname]);

  const cls = (id: string) => (active === id ? "active" : "");
  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        {s.favicon?.png32 ? <img className="nav-logo" src={s.favicon.png32} alt="" /> : <span className="dot" />}
        {s.alias}
        <span className="nav-parent">/ {s.brand}</span>
      </Link>
      <nav className="nav-links">
        <a href={a("#about")} className={cls("about")}>About</a>
        <a href={a("#skills")} className={cls("skills")}>Skills</a>
        <Link to="/projects" className={cls("projects")}>Projects</Link>
        <a href={a("#contact")} className="nav-cta">Contact</a>
      </nav>
      <div className="progress" style={{ transform: `scaleX(${progress})` }} />
    </header>
  );
}
