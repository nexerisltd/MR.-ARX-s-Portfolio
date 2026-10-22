export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load hoyni"));
    img.src = url;
  });
}

export function canvasToBlob(c: HTMLCanvasElement, type = "image/png", q?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, q)
  );
}

/** Resize keeping aspect ratio so the longest side is <= max. Returns JPEG/WebP blob. */
export async function shrinkImage(file: Blob, max: number, type = "image/jpeg", q = 0.88): Promise<{ blob: Blob; w: number; h: number }> {
  const img = await loadImage(file);
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s);
  const h = Math.round(img.naturalHeight * s);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return { blob: await canvasToBlob(c, type, q), w, h };
}
