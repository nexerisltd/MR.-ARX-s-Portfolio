// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)
/** Visitor er approx. location + IP er salted hash. Raw IP default e save/return hoy na (env STORE_RAW_IP=1 dile hoy). */
export const config = { runtime: "edge" };

// ---- geo / ip (Vercel request header theke — kono package lage na) ----
const hdr = (r: Request, k: string) => r.headers.get(k) || "";
const dec = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
const where = (r: Request) => ({
  country: hdr(r, "x-vercel-ip-country") || null,
  region: hdr(r, "x-vercel-ip-country-region") || null,
  city: dec(hdr(r, "x-vercel-ip-city")) || null,
});
const clientIp = (r: Request) => hdr(r, "x-real-ip") || hdr(r, "x-forwarded-for").split(",")[0].trim() || null;
async function sha(s: string, bytes = 12) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req: Request) {
  const g = where(req);
  const ip = clientIp(req);
  const salt = process.env.IP_SALT || "nexeris";
  const storeIp = process.env.STORE_RAW_IP === "1";
  const body = {
    ...g,
    ip_hash: ip ? await sha(salt + ip, 8) : null,
    ip: storeIp ? ip : null,
    ip_stored: storeIp,
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
