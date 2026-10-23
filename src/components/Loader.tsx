import { useEffect, useRef, useState } from "react";
import { useSettings } from "../lib/SettingsContext";

/** Preloader: model + font ready hole curtain uthe jay, tarpor hero intro shuru. */
export default function Loader({ onDone }: { onDone: () => void }) {
  const { settings: s, ready } = useSettings();
  const [pct, setPct] = useState(0);
  const [out, setOut] = useState(false);
  const flags = useRef({ stage: false, fonts: false, min: false });
  const need = useRef(true);
  need.current = !!s.character.model;
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    const f = flags.current;
    const onStage = () => (f.stage = true);
    window.addEventListener("stage-ready", onStage);
    document.fonts?.ready.then(() => (f.fonts = true));
    if (!document.fonts) f.fonts = true;
    const tMin = setTimeout(() => (f.min = true), 1100);
    const tMax = setTimeout(() => { f.stage = f.fonts = f.min = true; }, 7000);
    let p = 0, raf = 0, done = false;
    const tick = () => {
      const ok = f.min && f.fonts && readyRef.current && (f.stage || !need.current);
      p += ((ok ? 100 : 88) - p) * (ok ? 0.12 : 0.025);
      setPct(Math.round(p));
      if (ok && p > 99.2 && !done) {
        done = true;
        setOut(true);
        setTimeout(onDone, 900);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(tMin);
      clearTimeout(tMax);
      window.removeEventListener("stage-ready", onStage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (out) document.documentElement.classList.add("ready");
  }, [out]);

  return (
    <div className={`loader ${out ? "out" : ""}`}>
      <div className="loader-in">
        <span className="loader-name">{s.alias}</span>
        <span className="loader-brand">{s.brand}</span>
        <span className="loader-pct">{String(pct).padStart(3, "0")}</span>
      </div>
      <div className="loader-bar"><i style={{ transform: `scaleX(${pct / 100})` }} /></div>
    </div>
  );
}
