import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";

export default define.page(function StudentHome() {
  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <Head>
        <title>学生トップ | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">学生トップ</h1>
      <p class="mt-2 text-slate-600">公開問題の確認と自分の提出状況の確認を行います。</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <a href="/student/problems" class="rounded border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <h2 class="font-semibold">問題一覧</h2>
          <p class="mt-1 text-sm text-slate-600">公開中の問題を確認します。</p>
        </a>
        <a href="/student/submissions" class="rounded border border-slate-200 bg-white p-4 hover:bg-slate-50">
          <h2 class="font-semibold">自分の提出</h2>
          <p class="mt-1 text-sm text-slate-600">自分の提出履歴のみ表示します。</p>
        </a>
      </div>
    </div>
  );
});
