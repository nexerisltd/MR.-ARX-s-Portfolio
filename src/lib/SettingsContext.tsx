import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_PROJECTS, DEFAULT_SETTINGS } from "./defaults";
import { applyFavicon } from "./favicon";
import { supabase } from "./supabase";
import type { Project, SiteSettings } from "./types";

interface Ctx {
  settings: SiteSettings;
  projects: Project[];
  ready: boolean;
  configured: boolean;
  reload: () => Promise<void>;
  saveSettings: (next: SiteSettings) => Promise<void>;
}

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [ready, setReady] = useState(!supabase);

  const reload = useCallback(async () => {
    if (!supabase) return;
    try {
      const [s, p] = await Promise.all([
        supabase.from("site_settings").select("data").eq("id", 1).maybeSingle(),
        supabase.from("projects").select("*").order("sort", { ascending: true }),
      ]);
      const d = (s.data?.data ?? {}) as Partial<SiteSettings>;
      setSettings({ ...DEFAULT_SETTINGS, ...d, character: { ...DEFAULT_SETTINGS.character, ...(d.character ?? {}) } });
      if (!p.error && p.data) setProjects(p.data as Project[]);
    } catch (e) {
      console.warn("Supabase load failed, defaults use hocche", e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    const title = `${settings.alias} — ${settings.brand}`;
    document.title = title;
    const meta = (key: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    meta("description", settings.tagline);
    meta("og:title", title, "property");
    meta("og:description", settings.tagline, "property");
    meta("og:type", "website", "property");
    meta("twitter:card", "summary");
    if (settings.favicon?.png512) meta("og:image", settings.favicon.png512, "property");
    applyFavicon(settings.favicon as unknown as Record<string, string> | null);
  }, [settings.alias, settings.brand, settings.tagline, settings.favicon]);

  const saveSettings = async (next: SiteSettings) => {
    if (!supabase) throw new Error("Supabase configured na — .env file check koro");
    const { error } = await supabase.from("site_settings").upsert({ id: 1, data: next });
    if (error) throw error;
    setSettings(next);
  };

  return (
    <SettingsCtx.Provider value={{ settings, projects, ready, configured: !!supabase, reload, saveSettings }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error("useSettings must be inside SettingsProvider");
  return c;
}
