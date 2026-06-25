import { define } from "../../../utils.ts";
import { badRequest, json } from "../../../lib/http.ts";

type Role = "teacher" | "student";

function cookie(name: string, value: string, maxAgeSec: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export const handler = define.handlers({
  async POST(ctx) {
    let userId = "";
    let role = "";
    let redirectTo = "/";

    const contentType = ctx.req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await ctx.req.json().catch(() => null) as {
        userId?: string;
        role?: string;
        redirectTo?: string;
      } | null;
      userId = body?.userId?.trim() ?? "";
      role = body?.role?.trim() ?? "";
      redirectTo = body?.redirectTo?.trim() || "/";
    } else {
      const form = await ctx.req.formData().catch(() => null);
      userId = String(form?.get("userId") ?? "").trim();
      role = String(form?.get("role") ?? "").trim();
      redirectTo = String(form?.get("redirectTo") ?? "/").trim() || "/";
    }

    if (!userId) {
      return badRequest("INVALID_REQUEST", "userId is required");
    }
    if (role !== "teacher" && role !== "student") {
      return badRequest("INVALID_REQUEST", "role must be teacher or student");
    }

    const headers = new Headers();
    headers.append("set-cookie", cookie("mc_user_id", userId, 60 * 60 * 24 * 7));
    headers.append("set-cookie", cookie("mc_role", role, 60 * 60 * 24 * 7));

    if (contentType.includes("application/json")) {
      headers.set("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    }

    headers.set("location", redirectTo);
    return new Response(null, { status: 303, headers });
  },

  DELETE() {
    const headers = new Headers();
    headers.append("set-cookie", cookie("mc_user_id", "", 0));
    headers.append("set-cookie", cookie("mc_role", "", 0));
    return json({ ok: true }, 200);
  },
});
