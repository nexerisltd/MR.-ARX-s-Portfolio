import { useEffect, useState } from "react";
import { buildManifest, generateFaviconSet, IconFile } from "../../lib/favicon";
import { uploadBlob } from "../../lib/supabase";
import { useSettings } from "../../lib/SettingsContext";
import type { FaviconFiles } from "../../lib/types";

export default function FaviconPanel() {
  const { settings, saveSettings } = useSettings();
  const [icons, setIcons] = useState<{ f: IconFile; url: string }[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => icons.forEach((i) => URL.revokeObjectURL(i.url)), [icons]);

  const say = (m: string) => setLog((l) => [...l, m]);

  const onPick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setLog([]);
    try {
      say("Favicon set generate hocche…");
      const set = await generateFaviconSet(file);
      setIcons(set.map((f) => ({ f, url: URL.createObjectURL(f.blob) })));
      const v = Date.now();
      const urls: Record<string, string> = {};
      for (const ic of set) {
        urls[ic.key] = (await uploadBlob(`favicon/${ic.name}`, ic.blob, ic.type)) + `?v=${v}`;
        say(`Uploaded ${ic.name}`);
      }
      const m = await uploadBlob(
        "favicon/site.webmanifest",
        buildManifest(`${settings.alias} — ${settings.brand}`, settings.alias, urls),
        "application/manifest+json"
      );
      urls.manifest = m + `?v=${v}`;
      say("Uploaded site.webmanifest");
      await saveSettings({ ...settings, favicon: urls as unknown as FaviconFiles });
      say("Done ✓ — site er favicon update hoye geche (browser tab refresh koro).");
    } catch (e) {
      say("Error: " + (e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="panel wide">
      <h2>Favicon</h2>
      <p className="muted">Ekta image choose koro — .ico, 16/32/48, apple-touch (180), android 192/512, maskable 512 ar manifest shob auto generate hoye upload hobe. Square image best.</p>
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => onPick(e.target.files?.[0])} />
      {icons.length > 0 && (
        <div className="icon-grid">
          {icons.map(({ f, url }) => (
            <figure key={f.key}>
              <img src={url} alt={f.name} style={{ width: Math.min(f.size, 96), height: Math.min(f.size, 96) }} />
              <figcaption>{f.name}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {!icons.length && settings.favicon && <p className="muted">Ekhon ekta favicon set kora ache. Notun image choose korle replace hobe.</p>}
      <pre className="log">{log.join("\n")}</pre>
    </div>
  );
}
