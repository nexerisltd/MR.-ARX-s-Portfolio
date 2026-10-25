import { useEffect, useRef, useState } from "react";
import { loadLikes, sendLike, useLikes, WEEK_MS } from "../lib/likes";

const Heart = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 2.6 5 6 5c2 0 3.4 1.1 4.2 2.4h.0C11 6.1 12.4 5 14.4 5c3.4 0 5.1 3.6 3.6 6.9C19.5 16.4 12 21 12 21z" transform="translate(0 -.5)" />
  </svg>
);

/** Login chhara like. Ek jon 7 diner moddhe ekbar (server e enforce kora). */
export default function LikeButton({ target, mini = false }: { target: string; mini?: boolean }) {
  const s = useLikes();
  const [burst, setBurst] = useState(0);
  const [tip, setTip] = useState("");
  const timer = useRef(0);
  useEffect(() => { void loadLikes(); }, []);
  if (!s.available) return null;

  const n = s.counts[target] ?? 0;
  const likedAt = s.liked[target];
  const showTip = (m: string) => { setTip(m); clearTimeout(timer.current); timer.current = window.setTimeout(() => setTip(""), 3200); };
  const daysLeft = () => Math.max(1, Math.ceil((new Date(likedAt).getTime() + WEEK_MS - Date.now()) / 86400000));

  const click = async () => {
    if (likedAt) return showTip(`Already liked ♥ — you can like again in ${daysLeft()} day${daysLeft() > 1 ? "s" : ""}`);
    setBurst((b) => b + 1);
    const r = await sendLike(target);
    if (r === "ok") showTip("Thanks for the like! ♥");
    else if (r === "already") showTip("You've already liked this this week");
    else showTip("Couldn't send the like — try again later");
  };

  return (
    <div className={`like-wrap ${mini ? "mini" : "float"}`}>
      <button className={`like ${likedAt ? "on" : ""}`} onClick={click} aria-pressed={!!likedAt} aria-label={likedAt ? "Liked" : "Like"}>
        <span className="heart"><Heart /></span>
        <b>{n}</b>
        {!mini && <span className="like-label">{likedAt ? "Liked" : "Like"}</span>}
        {burst > 0 && <span className="burst" key={burst} aria-hidden>{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ "--a": `${i * 45}deg` } as React.CSSProperties} />)}</span>}
      </button>
      {tip && <span className="like-tip" role="status">{tip}</span>}
    </div>
  );
}
