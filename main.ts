import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { getConfig, shouldLog } from "./lib/config.ts";

export const app = new App<State>();
const config = getConfig();

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
