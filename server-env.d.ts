// Vercel Edge runtime e `process.env` ache; type shim (@types/node chhara).
declare const process: { env: Record<string, string | undefined> };
