import type { PlatformIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { meshopt, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

export interface GlbOptions {
  targetTris: number; // koto triangle e nambe (e.g. 120000)
  maxTexture: number; // texture er max side px (e.g. 2048)
}
export type ResizeFn = (bytes: Uint8Array, mime: string, max: number) => Promise<{ bytes: Uint8Array; mime: string } | null>;
type Say = (m: string) => void;

/**
 * Boro GLB (e.g. Tripo/Meshy theke 60MB, 1M+ vertex) ke web-friendly kore:
 * weld → simplify → texture downscale → meshopt compress.
 * `io` = WebIO (browser) ba NodeIO (test).
 */
export async function optimizeGlb(io: PlatformIO, bytes: Uint8Array, o: GlbOptions, say: Say, resize?: ResizeFn): Promise<Uint8Array> {
  io.registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);

  say("GLB read hocche…");
  const doc = await io.readBinary(bytes);
  const root = doc.getRoot();

  let tris = 0;
  for (const mesh of root.listMeshes())
    for (const p of mesh.listPrimitives()) tris += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION")!.getCount()) / 3;
  say(`Original: ${Math.round(tris).toLocaleString()} triangles`);

  if (tris > o.targetTris) {
    say("Mesh simplify hocche (kichu somoy lagte pare)…");
    await doc.transform(
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio: o.targetTris / tris, error: 0.01 }),
      prune()
    );
  }

  if (resize) {
    for (const tex of root.listTextures()) {
      const img = tex.getImage();
      if (!img) continue;
      say("Texture chhoto kora hocche…");
      const r = await resize(img, tex.getMimeType() || "image/jpeg", o.maxTexture);
      if (r) {
        tex.setImage(r.bytes);
        tex.setMimeType(r.mime);
      }
    }
  }

  say("Compress hocche…");
  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const out = await io.writeBinary(doc);
  say(`Optimized size: ${(out.byteLength / 1048576).toFixed(1)} MB`);
  return out;
}

/** Browser: File -> optimized GLB blob */
export async function optimizeGlbFile(file: File, o: GlbOptions, say: Say): Promise<Blob> {
  const { WebIO } = await import("@gltf-transform/core");
  const resize: ResizeFn = async (bytes, mime, max) => {
    const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (s >= 1 && bytes.byteLength < 3_000_000) return null;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("texture encode failed"))), "image/jpeg", 0.88));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/jpeg" };
  };
  const out = await optimizeGlb(new WebIO(), new Uint8Array(await file.arrayBuffer()), o, say, resize);
  return new Blob([out as BlobPart], { type: "model/gltf-binary" });
}
