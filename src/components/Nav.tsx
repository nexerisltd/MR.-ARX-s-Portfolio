import { Link, useLocation } from "react-router-dom";
import { useSettings } from "../lib/SettingsContext";

export default function Nav() {
  const { settings: s } = useSettings();
  const { pathname } = useLocation();
  const home = pathname === "/";
  const a = (hash: string) => (home ? hash : `/${hash}`);
  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        <span className="dot" />
        {s.alias}
      </Link>
      <nav className="nav-links">
        <a href={a("#about")}>About</a>
        <a href={a("#skills")}>Skills</a>
        <Link to="/projects">Projects</Link>
        <a href={a("#contact")} className="nav-cta">Contact</a>
      </nav>
    </header>
  );
}
