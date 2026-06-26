import { define } from "../../../utils.ts";

function cookie(name: string, value: string, maxAgeSec: number): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export const handler = define.handlers({
  POST() {
    const headers = new Headers({ location: "/login" });
    headers.append("set-cookie", cookie("mc_user_id", "", 0));
    headers.append("set-cookie", cookie("mc_role", "", 0));
    headers.append("set-cookie", cookie("mc_must_change_password", "", 0));
    return new Response(null, { status: 303, headers });
  },
});
