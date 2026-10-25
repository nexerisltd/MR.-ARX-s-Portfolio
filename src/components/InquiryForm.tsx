import { useRef, useState } from "react";
import { getLinkCode, getSessionId, getVisitorId } from "../lib/analytics";
import { BUDGETS, SERVICES, TIMELINES } from "../lib/inquiry";

type Status = "idle" | "sending" | "done" | "error";

/** "Start a project" form — client ra ki chay seta bujhar jonno. Admin > Inquiries e ashe. */
export default function InquiryForm({ email }: { email: string }) {
  const [f, setF] = useState({ name: "", email: "", message: "", budget: "", timeline: "", hp: "" });
  const [services, setServices] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const t0 = useRef(performance.now());
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const toggle = (s: string) => setServices((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (f.message.trim().length < 10) { setStatus("error"); return setMsg("Please tell me a bit more about the project (10+ characters)."); }
    setStatus("sending");
    setMsg("");
    try {
      const r = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, services, t: Math.round(performance.now() - t0.current), vid: getVisitorId(), sid: getSessionId(), link: getLinkCode() }),
      });
      const j = await r.json().catch(() => null);
      if (r.ok && j?.ok) { setStatus("done"); return; }
      setStatus("error");
      if (!j) setMsg(`This form works on the live site only — please email me at ${email}.`);
      else if (r.status === 429) setMsg(`Too many messages from your network today — please email me at ${email}.`);
      else if (j.error === "invalid") setMsg(j.field === "email" ? "That email doesn't look right." : j.field === "name" ? "Please add your name." : "Please tell me a bit more about the project.");
      else if (j.error === "too_fast") setMsg("That was quick — please take a moment and try again.");
      else setMsg(`Couldn't send right now — please email me at ${email}.`);
    } catch {
      setStatus("error");
      setMsg(`Couldn't send right now — please email me at ${email}.`);
    }
  };

  if (status === "done")
    return (
      <div className="inq inq-done">
        <h3>Thank you ♥</h3>
        <p>Your message is in. I'll reply to {f.email} soon.</p>
      </div>
    );

  return (
    <form className="inq" onSubmit={submit} noValidate>
      <h3 className="inq-title">Start a project</h3>
      <div className="inq-grid">
        <label>Your name<input value={f.name} onChange={set("name")} autoComplete="name" required maxLength={80} /></label>
        <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required maxLength={120} /></label>
      </div>
      <div className="inq-q">What do you need?</div>
      <div className="inq-chips">
        {SERVICES.map((s) => <button type="button" key={s} className={`chip ${services.includes(s) ? "on" : ""}`} onClick={() => toggle(s)} aria-pressed={services.includes(s)}>{s}</button>)}
      </div>
      <div className="inq-grid">
        <label>Budget<select value={f.budget} onChange={set("budget")}><option value="">Select…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></label>
        <label>Timeline<select value={f.timeline} onChange={set("timeline")}><option value="">Select…</option>{TIMELINES.map((t) => <option key={t}>{t}</option>)}</select></label>
      </div>
      <label>About the project<textarea rows={4} value={f.message} onChange={set("message")} maxLength={2000} placeholder="What are you building, and what should it do?" required /></label>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden value={f.hp} onChange={set("hp")} />
      <div className="inq-foot">
        <button className="btn btn-solid" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send message"}</button>
        {msg && <span className="inq-err" role="alert">{msg}</span>}
      </div>
      <p className="inq-note">Your name and email are used only to reply to you. Anonymous visit info (pages viewed, approx. location) is attached to help me understand what you need.</p>
    </form>
  );
}
