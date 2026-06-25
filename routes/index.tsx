import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Home(ctx) {
  const { role, userId } = ctx.state.auth;

  return (
    <div class="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <Head>
        <title>ホーム | marucoder</title>
      </Head>
      <div class="space-y-6">
        <section class="rounded border border-slate-200 bg-white p-6">
          <h1 class="text-3xl font-bold text-slate-900">marucoder ホーム</h1>
          <p class="mt-2 text-slate-600">
            現在のセッション: {role} / {userId}
          </p>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <form method="post" action="/api/auth/session" class="rounded border border-slate-200 bg-white p-5">
            <h2 class="text-xl font-semibold text-slate-900">教員として利用</h2>
            <p class="mt-2 text-sm text-slate-600">教卓進捗、問題管理、提出監視を行います。</p>
            <input type="hidden" name="role" value="teacher" />
            <input type="hidden" name="redirectTo" value="/teacher" />
            <input
              type="text"
              name="userId"
              value={role === "teacher" ? userId : "teacher-demo"}
              class="mt-3 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button class="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white" type="submit">教員画面へ</button>
          </form>

          <form method="post" action="/api/auth/session" class="rounded border border-slate-200 bg-white p-5">
            <h2 class="text-xl font-semibold text-slate-900">学生として利用</h2>
            <p class="mt-2 text-sm text-slate-600">公開中の問題閲覧と自分の提出確認を行います。</p>
            <input type="hidden" name="role" value="student" />
            <input type="hidden" name="redirectTo" value="/student" />
            <input
              type="text"
              name="userId"
              value={role === "student" ? userId : "student-demo"}
              class="mt-3 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button class="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white" type="submit">学生画面へ</button>
          </form>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <a
            href={role === "teacher" ? "/teacher/dashboard" : "/student/problems"}
            class="rounded border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
          >
            <h2 class="text-xl font-semibold text-slate-900">{role === "teacher" ? "教卓進捗" : "問題一覧"}</h2>
            <p class="mt-2 text-sm text-slate-600">
              {role === "teacher"
                ? "グループ別テーブルと席順マップで進行度合いを確認します。"
                : "公開中の問題を確認し、課題に取り組みます。"}
            </p>
          </a>

          <a
            href={role === "teacher" ? "/submissions" : "/student/submissions"}
            class="rounded border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
          >
            <h2 class="text-xl font-semibold text-slate-900">{role === "teacher" ? "提出履歴" : "自分の提出"}</h2>
            <p class="mt-2 text-sm text-slate-600">
              {role === "teacher"
                ? "問題・グループ・提出時刻を一覧し、詳細に移動します。"
                : "自分の提出結果と時刻を確認します。"}
            </p>
          </a>
        </section>
      </div>
    </div>
  );
});
