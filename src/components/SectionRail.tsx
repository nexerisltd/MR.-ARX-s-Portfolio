import { useEffect, useState } from "react";

const LABEL: Record<string, string> = { hero: "Intro", about: "About", skills: "Craft", journey: "Journey", work: "Work", studio: "Studio", contact: "Contact" };

/** Dan pashe section dot-nav: kon section e achho dekhay, click korle shei section e jay. */
export default function SectionRail() {
  const [ids, setIds] = useState<string[]>([]);
  const [active, setActive] = useState("hero");
  const [top, setTop] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIds(Array.from(document.querySelectorAll<HTMLElement>("[data-stage]")).map((e) => e.dataset.stage!)), 900);
    const onScroll = () => setTop(window.scrollY > 1200);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    if (!ids.length) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.stage!)),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    document.querySelectorAll("[data-stage]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);

  const go = (id: string) => document.querySelector(`[data-stage="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (ids.length < 2) return null;
  return (
    <nav className="rail" aria-label="Sections">
      {ids.map((id) => (
        <button key={id} className={active === id ? "on" : ""} onClick={() => go(id)} aria-label={LABEL[id] ?? id} aria-current={active === id}>
          <span>{LABEL[id] ?? id}</span><i />
        </button>
      ))}
      <button className={`rail-top ${top ? "show" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" tabIndex={top ? 0 : -1}>↑</button>
    </nav>
  );
}
