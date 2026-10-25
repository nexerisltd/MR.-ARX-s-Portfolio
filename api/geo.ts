import { geolocation, ipAddress } from "@vercel/functions";

// Vercel Edge Function: visitor er approx. location (Vercel nijei IP theke dey) + IP er salted hash.
// Default e raw IP kothao save/return hoy na (opt-in niche). Optional: Vercel env e IP_SALT dao (random lomba string).
export const config = { runtime: "edge" };

async function hash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default async function handler(req: Request) {
  const g = geolocation(req);
  const ip = ipAddress(req);
  const salt = (typeof process !== "undefined" && process.env?.IP_SALT) || "nexeris";
  // Raw IP default e save hoy na. Vercel env e STORE_RAW_IP=1 dile tobei (site er footer e auto notice dekhay).
  const storeIp = typeof process !== "undefined" && process.env?.STORE_RAW_IP === "1";
  const body = {
    country: g.country ?? null,
    region: g.countryRegion ?? null,
    city: g.city ?? null,
    ip_hash: ip ? await hash(salt + ip) : null,
    ip: storeIp ? ip ?? null : null,
    ip_stored: storeIp,
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "no-store" } });
}
