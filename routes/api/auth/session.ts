import { define } from "../../../utils.ts";
import { badRequest, json } from "../../../lib/http.ts";
import { authenticate } from "../../../lib/auth_service.ts";

function cookie(name: string, value: string, maxAgeSec: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function redirectPath(role: "admin" | "teacher" | "student", mustChangePassword: boolean): string {
  if (mustChangePassword) return "/auth/change-password";
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
}

export const handler = define.handlers({
  async POST(ctx) {
    let username = "";
    let password = "";
    let redirectTo = "/";

    const contentType = ctx.req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await ctx.req.json().catch(() => null) as {
        username?: string;
        password?: string;
        redirectTo?: string;
      } | null;
      username = body?.username?.trim() ?? "";
      password = body?.password ?? "";
      redirectTo = body?.redirectTo?.trim() || "/";
    } else {
      const form = await ctx.req.formData().catch(() => null);
      username = String(form?.get("username") ?? "").trim();
      password = String(form?.get("password") ?? "");
      redirectTo = String(form?.get("redirectTo") ?? "/").trim() || "/";
    }

    if (!username || !password) {
      return badRequest("INVALID_REQUEST", "username and password are required");
    }

    const user = await authenticate(username, password);
    if (!user) {
      return badRequest("INVALID_CREDENTIALS", "username or password is invalid");
    }

    const headers = new Headers();
    headers.append("set-cookie", cookie("mc_user_id", user.userId, 60 * 60 * 24 * 7));
    headers.append("set-cookie", cookie("mc_role", user.role, 60 * 60 * 24 * 7));
    headers.append("set-cookie", cookie("mc_must_change_password", user.mustChangePassword ? "1" : "0", 60 * 60 * 24 * 7));

    const finalRedirect = redirectTo === "/" ? redirectPath(user.role, user.mustChangePassword) : redirectTo;

    if (contentType.includes("application/json")) {
      headers.set("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers,
      });
    }

    headers.set("location", finalRedirect);
    return new Response(null, { status: 303, headers });
  },

  DELETE() {
    const headers = new Headers();
    headers.append("set-cookie", cookie("mc_user_id", "", 0));
    headers.append("set-cookie", cookie("mc_role", "", 0));
    headers.append("set-cookie", cookie("mc_must_change_password", "", 0));
    return json({ ok: true }, 200);
  },
});
