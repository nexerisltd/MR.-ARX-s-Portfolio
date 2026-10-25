import { useEffect, useState } from "react";
import { trackEvent, trackingEnabled } from "../lib/analytics";
import { INTENTS } from "../lib/inquiry";

/** Ek-tap poll: "What brings you here?" — kono naam/email lage na. Ekbar-i dekhay (25s ba 50% scroll por). */
export default function IntentPrompt() {
  const [show, setShow] = useState(false);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem("nx_intent")) return; } catch { /* ignore */ }
    if (!trackingEnabled()) return;
    let opened = false;
    const open = () => { if (!opened) { opened = true; setShow(true); } };
    const t = setTimeout(open, 25000);
    const onScroll = () => { const h = document.documentElement; if ((window.scrollY + window.innerHeight) / h.scrollHeight > 0.5) open(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  if (!show) return null;
  const done = (v: string) => { try { localStorage.setItem("nx_intent", v); } catch { /* ignore */ } };
  const choose = (v: string) => { trackEvent("intent", v); done(v); setThanks(true); setTimeout(() => setShow(false), 2200); };
  const skip = () => { done("skip"); setShow(false); };

  return (
    <div className="intent" role="dialog" aria-label="What brings you here?">
      {thanks ? <p className="intent-thanks">Thanks — that helps me a lot ♥</p> : (
        <>
          <button className="intent-x" onClick={skip} aria-label="Dismiss">✕</button>
          <p className="intent-q">What brings you here?</p>
          <div className="intent-opts">{INTENTS.map((i) => <button key={i} className="chip" onClick={() => choose(i)}>{i}</button>)}</div>
          <p className="intent-n">One tap, anonymous. No name or email needed.</p>
        </>
      )}
    </div>
  );
}
