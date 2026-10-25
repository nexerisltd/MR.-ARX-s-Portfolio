/** Visitor er approx. location + IP er salted hash. Raw IP default e save/return hoy na (env STORE_RAW_IP=1 dile hoy). */
export const config = { runtime: "edge" };

//#inline geo

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
