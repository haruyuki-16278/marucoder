import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function LoginPage() {
  return (
    <div class="mx-auto min-h-screen max-w-md px-4 py-10">
      <Head>
        <title>ログイン | marucoder</title>
      </Head>
      <div class="rounded border border-slate-200 bg-white p-6">
        <h1 class="text-2xl font-bold">ログイン</h1>
        <p class="mt-2 text-sm text-slate-600">ユーザー名とパスワードでログインしてください。</p>

        <form method="post" action="/api/auth/session" class="mt-4 space-y-3">
          <input
            type="text"
            name="username"
            placeholder="ユーザー名"
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="パスワード"
            class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <button type="submit" class="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white">ログイン</button>
        </form>

        <div class="mt-4 text-xs text-slate-500">
          <p>管理者ユーザー名: admin</p>
          <p>管理者パスワード: 環境変数 ADMIN_PASSWORD</p>
        </div>
      </div>
    </div>
  );
});
