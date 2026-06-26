import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";

export default define.page(function TeacherHome() {
  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <Head>
        <title>教員トップ | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">教員トップ</h1>
      <p class="mt-2 text-slate-600">問題管理、教卓進捗、提出履歴をここから運用します。</p>
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <a href="/teacher/problems" class="rounded border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <h2 class="font-semibold">問題管理</h2>
          <p class="mt-1 text-sm text-slate-600">問題の作成、編集、公開状態を管理します。</p>
        </a>
        <a href="/teacher/dashboard" class="rounded border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <h2 class="font-semibold">教卓進捗</h2>
          <p class="mt-1 text-sm text-slate-600">グループ進捗と席順マップを確認します。</p>
        </a>
        <a href="/submissions" class="rounded border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <h2 class="font-semibold">提出履歴</h2>
          <p class="mt-1 text-sm text-slate-600">全体の提出履歴を確認します。</p>
        </a>
      </div>

      <section class="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold">学生CSV一括登録</h2>
        <p class="mt-1 text-xs text-slate-500">ヘッダ: grade,attendanceNo</p>
        <form method="post" action="/api/users/import/students" class="mt-3">
          <textarea
            name="csv"
            class="h-40 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            defaultValue="grade,attendanceNo\n1,3\n1,4"
          />
          <button type="submit" class="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white">学生を登録</button>
        </form>
      </section>
    </div>
  );
});
