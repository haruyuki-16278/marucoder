import { define } from "../../../utils.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { badRequest, json } from "../../../lib/http.ts";
import { changePassword } from "../../../lib/auth_service.ts";

function cookie(name: string, value: string, maxAgeSec: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      newPassword?: string;
    } | null;

    const newPassword = body?.newPassword?.trim() ?? "";
    if (newPassword.length < 8) {
      return badRequest("INVALID_REQUEST", "newPassword must be at least 8 characters");
    }

    const ok = await changePassword(ctx.state.auth.userId, newPassword);
    if (!ok) {
      return badRequest("PASSWORD_CHANGE_FAILED", "password change failed");
    }

    const headers = new Headers();
    headers.append("set-cookie", cookie("mc_must_change_password", "0", 60 * 60 * 24 * 7));
    headers.set("content-type", "application/json; charset=utf-8");

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  },
});
