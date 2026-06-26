import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Home(ctx) {
  const { role, userId } = ctx.state.auth;

  return (
    <div class="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <Head>
        <title>ホーム | marucoder</title>
      </Head>
      <section class="rounded border border-slate-200 bg-white p-6">
        <h1 class="text-3xl font-bold text-slate-900">marucoder ホーム</h1>
        <p class="mt-2 text-slate-600">
          現在のセッション: {role} / {role === "student" ? `出席番号 ${userId}` : userId}
        </p>
      </section>

      <section class="mt-6 grid gap-4 md:grid-cols-2">
        {(role === "admin" || role === "teacher") && (
          <a href="/teacher/dashboard" class="rounded border border-slate-200 bg-white p-5 hover:bg-slate-50">
            <h2 class="text-xl font-semibold text-slate-900">教卓進捗</h2>
            <p class="mt-2 text-sm text-slate-600">グループ別テーブルと席順マップで進行度合いを確認します。</p>
          </a>
        )}

        {role === "admin" && (
          <a href="/admin" class="rounded border border-slate-200 bg-white p-5 hover:bg-slate-50">
            <h2 class="text-xl font-semibold text-slate-900">管理画面</h2>
            <p class="mt-2 text-sm text-slate-600">教員・学生のCSV一括登録を行います。</p>
          </a>
        )}

        {role === "teacher" && (
          <a href="/teacher" class="rounded border border-slate-200 bg-white p-5 hover:bg-slate-50">
            <h2 class="text-xl font-semibold text-slate-900">教員トップ</h2>
            <p class="mt-2 text-sm text-slate-600">問題管理、学生一括登録、提出確認を行います。</p>
          </a>
        )}

        {role === "student" && (
          <a href="/student" class="rounded border border-slate-200 bg-white p-5 hover:bg-slate-50">
            <h2 class="text-xl font-semibold text-slate-900">学生トップ</h2>
            <p class="mt-2 text-sm text-slate-600">公開問題の確認と提出を行います。</p>
          </a>
        )}
      </section>
    </div>
  );
});
