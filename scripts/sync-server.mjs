// Server file (middleware.ts + api/*.ts) gulo SELF-CONTAINED howa lage (Vercel e local import cholbe na).
// `server-src/` e edit koro, tarpor `npm run sync:server` — shared code (bot list, geo helper...) inline hoye
// root `middleware.ts` ar `api/*.ts` generate hoy. src/lib/bots.ts edit korle-o eta chalao.
import fs from "node:fs";
import path from "node:path";

const rd = (p) => fs.readFileSync(p, "utf8");
const noExport = (s) => s.replace(/^export /gm, "");
const parts = {
  bots: "// ---- bot classifier (src/lib/bots.ts theke) ----\n" + noExport(rd("src/lib/bots.ts")),
  lists: "// ---- inquiry options (src/lib/inquiry.ts theke) ----\n" + noExport(rd("src/lib/inquiry.ts")),
  geo: rd("server-src/_parts/geo.ts"),
  tg: rd("server-src/_parts/tg.ts"),
};
const HEADER = "// ⚙️ GENERATED FILE — edit `server-src/` o, tarpor `npm run sync:server`. (Vercel e local import cholbe na, tai sob inline.)\n";

function build(src, out) {
  let t = rd(src).replace(/^\/\/#inline (\w+)\s*$/gm, (_, k) => {
    if (!parts[k]) throw new Error(`unknown part ${k} in ${src}`);
    return parts[k];
  });
  // file er shurur doc-comment er pore HEADER
  t = HEADER + t;
  if (/^import /m.test(t)) throw new Error(`${out}: import paoa gese — server file e import rakha jabe na`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, t);
  console.log("wrote", out, `(${t.length} bytes)`);
}

build("server-src/middleware.ts", "middleware.ts");
for (const f of fs.readdirSync("server-src/api")) build(`server-src/api/${f}`, `api/${f}`);
