import { useEffect, useRef } from "react";

/** Custom cursor ring + magnetic button. Shudhu mouse (pointer: fine) e. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const r = ring.current!, d = dot.current!;
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    let mag: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const t = e.target as Element;
      const label = t.closest?.("[data-cursor]")?.getAttribute("data-cursor") ?? "";
      r.classList.toggle("hover", !!t.closest?.("a,button,input,select,textarea,.btn,[data-cursor]"));
      r.dataset.label = label;
      r.classList.toggle("label", !!label);
      const b = t.closest?.(".btn") as HTMLElement | null;
      if (mag && mag !== b) mag.style.transform = "";
      mag = b;
      if (b) {
        const bb = b.getBoundingClientRect();
        b.style.transform = `translate(${(x - (bb.left + bb.width / 2)) * 0.28}px, ${(y - (bb.top + bb.height / 2)) * 0.35}px)`;
      }
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      r.style.transform = `translate(${rx}px, ${ry}px)`;
      d.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("pointermove", move);
    loop();
    document.documentElement.classList.add("has-cursor");
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);
  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  );
}
