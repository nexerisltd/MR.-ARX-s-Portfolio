import { CSSProperties, useEffect, useRef } from "react";

/** Text ke word/char e bhag kore, ekta ekta kore mask theke uthe ashe. */
export default function SplitText({
  text, by = "word", className = "", eager = false, delay = 0,
}: { text: string; by?: "word" | "char"; className?: string; eager?: boolean; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (eager) return; // eager = hero; `html.ready` trigger kore
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);
  const parts = by === "char" ? Array.from(text) : text.split(" ");
  return (
    <span ref={ref} className={`split ${className}`} aria-label={text}>
      {parts.map((p, i) => (
        <span className="sw" key={i} aria-hidden>
          <span className="si" style={{ "--i": i, "--d": delay } as CSSProperties}>
            {p === " " ? "\u00A0" : p}
            {by === "word" && i < parts.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
