import { app } from "../main.ts";

const port = Number.parseInt(Deno.args[0] ?? "8787", 10);

console.log(`E2E server starting on http://127.0.0.1:${port}`);
Deno.serve({ port }, app.handler());
