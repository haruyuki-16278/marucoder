import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { getConfig, shouldLog } from "./lib/config.ts";
import { resolveAuth } from "./lib/auth.ts";

export const app = new App<State>();
const config = getConfig();

const BASIC_AUTH_USER = "marugoto";
const BASIC_AUTH_PASS = "kosen2026";

function unauthorizedBasic(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "www-authenticate": 'Basic realm="marucoder", charset="UTF-8"',
    },
  });
}

function isBasicAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;

  const encoded = auth.slice(6).trim();
  if (!encoded) return false;

  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  return user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS;
}

app.use((ctx) => {
  // Preflight は認証不要で通す。
  if (ctx.req.method === "OPTIONS") return ctx.next();
  if (!isBasicAuthorized(ctx.req)) return unauthorizedBasic();
  return ctx.next();
});

app.use(staticFiles());

app.use((ctx) => {
  if (ctx.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": config.corsOrigin,
        "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type,x-user-id",
      },
    });
  }
  return ctx.next();
});

// Pass a shared value from a middleware
app.use(async (ctx) => {
  ctx.state.shared = "hello";
  ctx.state.auth = resolveAuth(ctx.req);
  const res = await ctx.next();
  res.headers.set("access-control-allow-origin", config.corsOrigin);
  return res;
});

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  if (shouldLog("info", config.logLevel)) {
    console.log(`${ctx.req.method} ${ctx.req.url}`);
  }
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

// Include file-system based routes here
await app.fsRoutes();
