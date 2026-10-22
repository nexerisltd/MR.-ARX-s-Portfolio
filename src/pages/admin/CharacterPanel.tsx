import { useState } from "react";
import CharacterScene from "../../components/CharacterScene";
import { autoCutout, generateDepthMap } from "../../lib/depth";
import { optimizeGlbFile } from "../../lib/glb";
import { shrinkImage } from "../../lib/image";
import { uploadBlob } from "../../lib/supabase";
import { useSettings } from "../../lib/SettingsContext";
import type { CharacterCfg } from "../../lib/types";

const QUALITY: Record<string, { label: string; tris: number; tex: number }> = {
  fast: { label: "Fast (60k triangles)", tris: 60000, tex: 1024 },
  balanced: { label: "Balanced (120k triangles) — recommended", tris: 120000, tex: 2048 },
  high: { label: "High (250k triangles)", tris: 250000, tex: 2048 },
  raw: { label: "Original (optimize korbo na — max 45MB)", tris: Infinity, tex: 4096 },
};

type NumKey = "modelScale" | "modelRotation" | "modelY" | "modelLight" | "depthStrength" | "cutout" | "brightness";

export default function CharacterPanel() {
  const { settings, saveSettings } = useSettings();
  const [cfg, setCfg] = useState<CharacterCfg>(settings.character);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState("balanced");
  const say = (m: string) => setLog((l) => [...l.slice(-12), m]);

  const persist = async (next: CharacterCfg, done = "Saved ✓") => {
    setCfg(next);
    await saveSettings({ ...settings, character: next });
    say(done);
  };

  /** 3D model (.glb) upload -> auto optimize -> upload -> set */
  const onModel = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setLog([]);
    try {
      if (!/\.glb$/i.test(file.name)) throw new Error("Shudhu .glb file dao (single-file glTF binary).");
      const q = QUALITY[quality];
      say(`Original size: ${(file.size / 1048576).toFixed(1)} MB`);
      let blob: Blob = file;
      if (quality === "raw") {
        if (file.size > 45 * 1048576) throw new Error("File 45MB er beshi — optimize option select koro.");
      } else {
        blob = await optimizeGlbFile(file, { targetTris: q.tris, maxTexture: q.tex }, say);
      }
      say("Upload hocche…");
      const url = (await uploadBlob("character/model.glb", blob, "model/gltf-binary")) + `?v=${Date.now()}`;
      await persist({ ...cfg, model: url }, "Done ✓ — 3D model set hoye geche. Niche slider diye rotation/size thik koro.");
    } catch (e) {
      say("Error: " + (e as Error).message);
    }
    setBusy(false);
  };

  /** Photo -> depth relief (alternative, jodi .glb na thake) */
  const onPhoto = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setLog([]);
    try {
      say("Image optimize + upload hocche…");
      const { blob: src } = await shrinkImage(file, 1600, "image/jpeg", 0.88);
      const v = Date.now();
      const image = (await uploadBlob("character/source.jpg", src, "image/jpeg")) + `?v=${v}`;
      const { blob: depthBlob, usedModel } = await generateDepthMap(src, say);
      say("Depth map upload hocche…");
      const depth = (await uploadBlob("character/depth.png", depthBlob, "image/png")) + `?v=${v}`;
      const cutout = await autoCutout(depthBlob);
      await persist(
        { ...cfg, image, depth, cutout, model: "" },
        usedModel ? "Done ✓ — photo relief set hoyeche." : "Done, kintu AI depth model load hoyni, rough depth use hoyeche."
      );
    } catch (e) {
      say("Error: " + (e as Error).message);
    }
    setBusy(false);
  };

  const save = async () => {
    try { await persist(cfg); } catch (e) { say("Error: " + (e as Error).message); }
  };
  const slider = (k: NumKey, label: string, min: number, max: number, step = 0.01) => (
    <label>{label}: {cfg[k].toFixed(2)}
      <input type="range" min={min} max={max} step={step} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: parseFloat(e.target.value) })} />
    </label>
  );

  return (
    <div className="panel wide char-admin">
      <div>
        <h2>3D character</h2>

        <h3 className="sub">1. 3D model upload (.glb) — recommended</h3>
        <p className="muted">Tripo / Meshy / Hunyuan3D ba onno jekono tool theke pawa <code>.glb</code> file dao. Boro file (60MB+) browser nijei optimize kore chhoto kore dibe.</p>
        <select value={quality} onChange={(e) => setQuality(e.target.value)} disabled={busy}>
          {Object.entries(QUALITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="file" accept=".glb,model/gltf-binary" disabled={busy} onChange={(e) => onModel(e.target.files?.[0])} />
        {cfg.model && (
          <>
            {slider("modelScale", "Size", 0.5, 1.6)}
            {slider("modelRotation", "Rotation (degree)", -180, 180, 1)}
            {slider("modelY", "Upor-niche", -0.8, 0.8)}
            {slider("modelLight", "Light", 0.4, 2.2)}
            <div className="row">
              <button className="btn btn-solid" onClick={save} disabled={busy}>Save adjustments</button>
              <button className="btn danger" disabled={busy} onClick={() => persist({ ...cfg, model: "" }, "3D model soriye photo relief use hocche ✓")}>Remove model</button>
            </div>
          </>
        )}

        <h3 className="sub">2. Photo theke 3D relief (alternative)</h3>
        <p className="muted">.glb na thakle photo theke depth-relief banano jay (quality kom). Choose korle model replace hoye photo mode e jabe.</p>
        <input type="file" accept="image/*" disabled={busy} onChange={(e) => onPhoto(e.target.files?.[0])} />
        {!cfg.model && (
          <>
            {slider("depthStrength", "Depth", 0, 1.5)}
            {slider("cutout", "Background cutout", 0.05, 0.9)}
            {slider("brightness", "Brightness", 0.6, 2.4)}
            <div className="row"><button className="btn btn-solid" onClick={save} disabled={busy}>Save adjustments</button></div>
          </>
        )}
        <pre className="log">{log.join("\n")}</pre>
      </div>
      <div className="char-preview"><CharacterScene cfg={cfg} /></div>
    </div>
  );
}
