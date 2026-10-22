import { canvasToBlob, loadImage } from "./image";

export interface IconFile { key: string; name: string; blob: Blob; type: string; size: number }

const BG = "#0a0908";

function square(img: HTMLImageElement, size: number, opts: { pad?: number; bg?: string } = {}) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, size, size);
  }
  const inner = size * (1 - (opts.pad ?? 0) * 2);
  const off = (size - inner) / 2;
  // center-crop (cover) so any photo becomes a square icon
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - s) / 2;
  const sy = (img.naturalHeight - s) / 2;
  ctx.drawImage(img, sx, sy, s, s, off, off, inner, inner);
  return c;
}

/** ICO container with embedded PNGs (works in every modern browser). */
async function buildIco(sizes: number[], img: HTMLImageElement): Promise<Blob> {
  const pngs = await Promise.all(
    sizes.map(async (s) => new Uint8Array(await (await canvasToBlob(square(img, s))).arrayBuffer()))
  );
  const head = 6 + sizes.length * 16;
  const total = head + pngs.reduce((a, p) => a + p.length, 0);
  const buf = new ArrayBuffer(total);
  const dv = new DataView(buf);
  dv.setUint16(0, 0, true);
  dv.setUint16(2, 1, true);
  dv.setUint16(4, sizes.length, true);
  let off = head;
  sizes.forEach((s, i) => {
    const e = 6 + i * 16;
    dv.setUint8(e, s >= 256 ? 0 : s);
    dv.setUint8(e + 1, s >= 256 ? 0 : s);
    dv.setUint8(e + 2, 0);
    dv.setUint8(e + 3, 0);
    dv.setUint16(e + 4, 1, true);
    dv.setUint16(e + 6, 32, true);
    dv.setUint32(e + 8, pngs[i].length, true);
    dv.setUint32(e + 12, off, true);
    new Uint8Array(buf, off, pngs[i].length).set(pngs[i]);
    off += pngs[i].length;
  });
  return new Blob([buf], { type: "image/x-icon" });
}

export async function generateFaviconSet(file: Blob): Promise<IconFile[]> {
  const img = await loadImage(file);
  const png = async (key: string, name: string, size: number, o?: { pad?: number; bg?: string }): Promise<IconFile> => ({
    key, name, size, type: "image/png", blob: await canvasToBlob(square(img, size, o)),
  });
  const ico = await buildIco([16, 32, 48], img);
  return [
    { key: "ico", name: "favicon.ico", size: 48, type: "image/x-icon", blob: ico },
    await png("png16", "favicon-16x16.png", 16),
    await png("png32", "favicon-32x32.png", 32),
    await png("png48", "favicon-48x48.png", 48),
    await png("apple180", "apple-touch-icon.png", 180, { bg: BG }),
    await png("png192", "android-chrome-192x192.png", 192),
    await png("png512", "android-chrome-512x512.png", 512),
    await png("maskable512", "maskable-512x512.png", 512, { bg: BG, pad: 0.12 }),
  ];
}

export function buildManifest(name: string, short: string, urls: Record<string, string>): Blob {
  const m = {
    name,
    short_name: short,
    start_url: "/",
    display: "standalone",
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: urls.png192, sizes: "192x192", type: "image/png" },
      { src: urls.png512, sizes: "512x512", type: "image/png" },
      { src: urls.maskable512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Blob([JSON.stringify(m, null, 2)], { type: "application/manifest+json" });
}

/** Runtime: public site er <head> e uploaded favicon set boshay. */
export function applyFavicon(f: Record<string, string> | null, v?: string) {
  if (!f) return;
  const set = (rel: string, href: string, extra: Record<string, string> = {}, id?: string) => {
    const sel = id ? `link[data-nx="${id}"]` : `link[rel="${rel}"]`;
    let el = document.head.querySelector<HTMLLinkElement>(sel);
    if (!el) {
      el = document.createElement("link");
      if (id) el.dataset.nx = id;
      document.head.appendChild(el);
    }
    el.rel = rel;
    el.href = href + (v ? `?v=${v}` : "");
    Object.entries(extra).forEach(([k, val]) => el!.setAttribute(k, val));
  };
  document.head.querySelectorAll('link[rel="icon"]:not([data-nx])').forEach((n) => n.remove());
  set("icon", f.ico, { sizes: "48x48" }, "ico");
  set("icon", f.png32, { type: "image/png", sizes: "32x32" }, "p32");
  set("icon", f.png16, { type: "image/png", sizes: "16x16" }, "p16");
  set("apple-touch-icon", f.apple180, { sizes: "180x180" }, "apple");
  set("manifest", f.manifest, {}, "manifest");
}
