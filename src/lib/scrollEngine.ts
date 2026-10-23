import { useEffect, useRef } from "react";

/**
 * Chhoto scroll engine (library chhara). Element er scroll progress (0..1) ke
 * smooth kore CSS variable `--p` e boshay; `--sy` e smoothed scrollY.
 *  pass: viewport er bhetor diye jaowar progress
 *  pin : tall (sticky) section er bhetor progress
 *  exit: element er upor diye ber hoye jaowar progress
 */
export type Kind = "pass" | "pin" | "exit";
interface Item { el: HTMLElement; kind: Kind; cur: number; last: number; init: boolean }

const items = new Set<Item>();
let raf = 0;
let sy = 0;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function loop() {
  raf = requestAnimationFrame(loop);
  const vh = window.innerHeight;
  sy += (window.scrollY - sy) * (reduce ? 1 : 0.1);
  document.documentElement.style.setProperty("--sy", sy.toFixed(1));
  items.forEach((it) => {
    const r = it.el.getBoundingClientRect();
    const t = clamp(
      it.kind === "pass" ? (vh - r.top) / (vh + r.height)
      : it.kind === "pin" ? -r.top / Math.max(1, r.height - vh)
      : -r.top / Math.max(1, r.height)
    );
    const off = r.bottom < -vh || r.top > vh * 2;
    if (!it.init || off || reduce) { it.cur = t; it.init = true; } else it.cur += (t - it.cur) * 0.14;
    if (Math.abs(it.cur - it.last) > 0.0002 || it.last < 0) {
      it.last = it.cur;
      it.el.style.setProperty("--p", it.cur.toFixed(4));
    }
  });
}

export function track(el: HTMLElement, kind: Kind = "pass") {
  const it: Item = { el, kind, cur: 0, last: -1, init: false };
  items.add(it);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    items.delete(it);
    if (!items.size) { cancelAnimationFrame(raf); raf = 0; }
  };
}

export function useTrack<T extends HTMLElement>(kind: Kind = "pass") {
  const ref = useRef<T>(null);
  useEffect(() => (ref.current ? track(ref.current, kind) : undefined), [kind]);
  return ref;
}
