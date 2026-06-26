import { define } from "../utils.ts";

export default define.page(function App(ctx) {
  const isAuthenticated = ctx.state.auth.isAuthenticated;
  const role = ctx.state.auth.role;
  const userId = ctx.state.auth.userId;

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>marucoder</title>
      </head>
      <body class="bg-slate-50 text-slate-900">
        <header class="border-b border-slate-200 bg-white">
          <nav class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
            <a href="/" class="font-semibold text-slate-700 hover:text-slate-900">ホーム</a>
            {isAuthenticated
              ? (
                <>
                  {role === "admin"
                    ? (
                      <>
                        <a href="/admin" class="font-semibold text-slate-700 hover:text-slate-900">管理画面</a>
                        <a href="/teacher/dashboard" class="font-semibold text-slate-700 hover:text-slate-900">教卓進捗</a>
                        <a href="/submissions" class="font-semibold text-slate-700 hover:text-slate-900">提出履歴</a>
                      </>
                    )
                    : role === "teacher"
                    ? (
                      <>
                        <a href="/teacher" class="font-semibold text-slate-700 hover:text-slate-900">教員トップ</a>
                        <a href="/teacher/problems" class="font-semibold text-slate-700 hover:text-slate-900">問題管理</a>
                        <a href="/teacher/dashboard" class="font-semibold text-slate-700 hover:text-slate-900">教卓進捗</a>
                        <a href="/submissions" class="font-semibold text-slate-700 hover:text-slate-900">提出履歴</a>
                      </>
                    )
                    : (
                      <>
                        <a href="/student" class="font-semibold text-slate-700 hover:text-slate-900">学生トップ</a>
                        <a href="/student/problems" class="font-semibold text-slate-700 hover:text-slate-900">問題一覧</a>
                        <a href="/student/submissions" class="font-semibold text-slate-700 hover:text-slate-900">自分の提出</a>
                      </>
                    )}
                  <span class="ml-auto text-xs text-slate-500">
                    {role === "student" ? `出席番号: ${userId}` : `${role}: ${userId}`}
                  </span>
                  <form method="post" action="/api/auth/logout">
                    <button type="submit" class="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">ログアウト</button>
                  </form>
                </>
              )
              : (
                <a href="/login" class="ml-auto font-semibold text-slate-700 hover:text-slate-900">ログイン</a>
              )}
          </nav>
        </header>
        <ctx.Component />
      </body>
    </html>
  );
});
