import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// `/api/*` (geo, like) shudhu Vercel e chole. Local `npm run dev` e Vite jeno oi file gulo
// module hishebe compile korte na jay, tai 404 JSON diye dei — site ta chup-chap fallback kore.
const devApiStub = (): Plugin => ({
  name: "dev-api-stub",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/api", (_req, res) => {
      res.statusCode = 404;
      res.setHeader("content-type", "application/json");
      res.end('{"error":"api routes run only on Vercel"}');
    });
  },
});

export default defineConfig({
  plugins: [devApiStub(), react()],
  build: { chunkSizeWarningLimit: 900 },
});
