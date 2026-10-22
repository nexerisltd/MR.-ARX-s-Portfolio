import { canvasToBlob, loadImage } from "./image";

// Browser e depth model (Depth Anything v2 small) run hoy — kono server/API key lagbe na.
// Model prothombar ~30-100MB download hoy, tarpor browser cache kore rakhe.
const LIB = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6";
const ATTEMPTS: [string, Record<string, unknown>][] = [
  ["onnx-community/depth-anything-v2-small", { device: "webgpu" }],
  ["onnx-community/depth-anything-v2-small", { dtype: "q8" }],
  ["Xenova/depth-anything-small-hf", { dtype: "q8" }],
];

type Progress = (msg: string) => void;

function stretch(gray: Uint8ClampedArray | number[], w: number, h: number): HTMLCanvasElement {
  let lo = 255, hi = 0;
  for (let i = 0; i < gray.length; i++) { if (gray[i] < lo) lo = gray[i]; if (gray[i] > hi) hi = gray[i]; }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const id = ctx.createImageData(w, h);
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < w * h; i++) {
    const v = ((gray[i] - lo) / span) * 255;
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
    id.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

/** Model load na hole fallback: brightness + center-bias diye rough depth. */
function pseudoDepth(img: HTMLImageElement): HTMLCanvasElement {
  const w = 256, h = Math.round((256 * img.naturalHeight) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const g = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const lum = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
      const cx = 1 - Math.min(1, Math.hypot((x / w - 0.5) * 1.6, (y / h - 0.55) * 1.0));
      g[i] = Math.min(255, (lum * 0.35 + cx * 0.65) * 255);
    }
  return stretch(g, w, h);
}

export async function generateDepthMap(file: Blob, onProgress: Progress): Promise<{ blob: Blob; usedModel: boolean }> {
  const img = await loadImage(file);
  let canvas: HTMLCanvasElement | null = null;
  try {
    onProgress("Depth model load hocche (prothombar ektu somoy lagbe)...");
    const lib: any = await import(/* @vite-ignore */ LIB);
    lib.env.allowLocalModels = false;
    let est: any = null;
    for (const [model, opts] of ATTEMPTS) {
      try {
        est = await lib.pipeline("depth-estimation", model, {
          ...opts,
          progress_callback: (p: any) => {
            if (p?.status === "progress" && typeof p.progress === "number")
              onProgress(`Model download: ${Math.round(p.progress)}%`);
          },
        });
        break;
      } catch (e) {
        console.warn("depth model attempt failed", model, opts, e);
      }
    }
    if (!est) throw new Error("kono depth model load hoyni");
    onProgress("Depth map banano hocche...");
    const url = URL.createObjectURL(file);
    const out = await est(url);
    const depth = (Array.isArray(out) ? out[0] : out).depth;
    const { width, height, channels, data } = depth;
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) gray[i] = data[i * channels];
    canvas = stretch(gray, width, height);
  } catch (e) {
    console.warn("Depth model fail, fallback use hocche", e);
  }
  const usedModel = !!canvas;
  const base = canvas ?? pseudoDepth(img);
  // halka blur — mesh smooth hoy, edge e spike hoy na
  const out = document.createElement("canvas");
  out.width = base.width; out.height = base.height;
  const ctx = out.getContext("2d")!;
  ctx.filter = "blur(2px)";
  ctx.drawImage(base, 0, 0);
  return { blob: await canvasToBlob(out, "image/png"), usedModel };
}

/** Otsu threshold diye foreground/background alada kore — cutout slider er auto default. */
export async function autoCutout(depthBlob: Blob): Promise<number> {
  const img = await loadImage(depthBlob);
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = Math.max(1, Math.round((128 * img.naturalHeight) / img.naturalWidth));
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
  const total = c.width * c.height;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, thr = 100;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sB += t * hist[t];
    const diff = sB / wB - (sum - sB) / wF;
    const v = wB * wF * diff * diff;
    if (v > best) { best = v; thr = t; }
  }
  return Math.min(0.7, Math.max(0.2, thr / 255));
}
