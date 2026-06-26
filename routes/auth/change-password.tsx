import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const form = await ctx.req.formData();
    const newPassword = String(form.get("newPassword") ?? "").trim();
    const confirmPassword = String(form.get("confirmPassword") ?? "").trim();

    if (newPassword.length < 8) {
      return new Response("新しいパスワードは8文字以上にしてください。", { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return new Response("確認用パスワードが一致しません。", { status: 400 });
    }

    const res = await fetch(new URL("/api/auth/change-password", ctx.req.url), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ctx.req.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({ newPassword }),
    });

    if (!res.ok) {
      const body = await res.text();
      return new Response(`パスワード変更に失敗しました: ${body}`, { status: 400 });
    }

    const role = ctx.state.auth.role;
    const location = role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/student";
    const headers = new Headers({ location });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) headers.set("set-cookie", setCookie);

    return new Response(null, { status: 303, headers });
  },
});

export default define.page(function ChangePasswordPage(ctx) {
  return (
    <div class="mx-auto min-h-screen max-w-md px-4 py-10">
      <Head>
        <title>パスワード変更 | marucoder</title>
      </Head>
      <div class="rounded border border-amber-300 bg-amber-50 p-6">
        <h1 class="text-2xl font-bold">初回パスワード変更</h1>
        <p class="mt-2 text-sm text-slate-700">初期パスワードでログインしたため、新しいパスワード登録が必要です。</p>
        <p class="mt-1 text-xs text-slate-600">ユーザー: {ctx.state.auth.userId}</p>

        <form method="post" class="mt-4 space-y-3">
          <input
            type="password"
            name="newPassword"
            placeholder="新しいパスワード (8文字以上)"
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
            minLength={8}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="確認用パスワード"
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
            minLength={8}
          />
          <button type="submit" class="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white">変更して続行</button>
        </form>
      </div>
    </div>
  );
});
