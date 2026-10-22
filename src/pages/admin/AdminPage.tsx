import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useSettings } from "../../lib/SettingsContext";
import CharacterPanel from "./CharacterPanel";
import FaviconPanel from "./FaviconPanel";
import ProfileTab from "./ProfileTab";
import ProjectsTab from "./ProjectsTab";

type Tab = "profile" | "character" | "favicon" | "projects";

function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabase!.auth.signInWithPassword({ email, password: pass });
    if (error) setErr(error.message);
    setBusy(false);
  };
  return (
    <div className="admin-login">
      <form onSubmit={submit} className="panel">
        <h2>Admin login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} required />
        {err && <p className="err">{err}</p>}
        <button className="btn btn-solid" disabled={busy}>{busy ? "..." : "Login"}</button>
        <Link to="/" className="muted">← Back to site</Link>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { configured } = useSettings();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured)
    return (
      <div className="admin-login">
        <div className="panel">
          <h2>Supabase connect kora nai</h2>
          <p className="muted">
            Project root e <code>.env</code> file banao (<code>.env.example</code> copy kore) ar
            VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY boshao. Tarpor <code>supabase/schema.sql</code> SQL Editor e run koro.
            Details README te ache.
          </p>
          <Link to="/" className="muted">← Back to site</Link>
        </div>
      </div>
    );
  if (session === undefined) return <div className="admin-login"><p className="muted">Loading…</p></div>;
  if (!session) return <Login />;

  return (
    <div className="admin">
      <header className="admin-top">
        <strong>Admin</strong>
        <div className="tabs">
          {([["profile", "Profile & content"], ["character", "3D character"], ["favicon", "Favicon"], ["projects", "Projects"]] as [Tab, string][]).map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="admin-right">
          <Link to="/" className="muted">View site</Link>
          <button className="btn" onClick={() => supabase!.auth.signOut()}>Logout</button>
        </div>
      </header>
      <main className="admin-body">
        {tab === "profile" && <ProfileTab />}
        {tab === "character" && <CharacterPanel />}
        {tab === "favicon" && <FaviconPanel />}
        {tab === "projects" && <ProjectsTab />}
      </main>
    </div>
  );
}
