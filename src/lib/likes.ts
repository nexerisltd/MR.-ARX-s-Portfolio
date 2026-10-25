import { useSyncExternalStore } from "react";
import { getVisitorId } from "./analytics";

interface State { available: boolean; loaded: boolean; counts: Record<string, number>; liked: Record<string, string>; msg: string }
let st: State = { available: false, loaded: false, counts: {}, liked: {}, msg: "" };
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
let started = false;
export const WEEK_MS = 7 * 86400000;

/** /api/like na thakle (local dev / env set na) like button lukiye thake. */
export async function loadLikes() {
  if (started) return;
  started = true;
  try {
    const r = await fetch(`/api/like?vid=${encodeURIComponent(getVisitorId())}`, { cache: "no-store" });
    if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return set({ loaded: true });
    const j = await r.json();
    set({ available: true, loaded: true, counts: j.counts ?? {}, liked: j.liked ?? {} });
  } catch { set({ loaded: true }); }
}

export async function sendLike(target: string): Promise<"ok" | "already" | "error"> {
  const before = st;
  // optimistic
  set({ counts: { ...st.counts, [target]: (st.counts[target] ?? 0) + 1 }, liked: { ...st.liked, [target]: new Date().toISOString() } });
  try {
    const r = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, vid: getVisitorId(), t: Math.round(performance.now()), hp: "" }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) { set({ counts: j.counts ?? st.counts }); return "ok"; }
    if (r.status === 429) { set({ counts: j.counts ?? before.counts, liked: { ...before.liked, [target]: j.liked_at ?? new Date().toISOString() } }); return "already"; }
    set({ counts: before.counts, liked: before.liked });
    return "error";
  } catch {
    set({ counts: before.counts, liked: before.liked });
    return "error";
  }
}

export const useLikes = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => st);
