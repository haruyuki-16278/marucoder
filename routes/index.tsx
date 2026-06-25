import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Home() {

  return (
    <div class="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <Head>
        <title>ホーム | marucoder</title>
      </Head>
      <div class="space-y-6">
        <section class="rounded border border-slate-200 bg-white p-6">
          <h1 class="text-3xl font-bold text-slate-900">marucoder 教員ホーム</h1>
          <p class="mt-2 text-slate-600">
            授業中の進捗確認、提出履歴の確認、席順とグループの運用をここから行います。
          </p>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <a
            href="/teacher/dashboard"
            class="rounded border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
          >
            <h2 class="text-xl font-semibold text-slate-900">教卓進捗</h2>
            <p class="mt-2 text-sm text-slate-600">
              グループ別テーブルと席順マップで進行度合いを確認します。
            </p>
          </a>

          <a
            href="/submissions"
            class="rounded border border-slate-200 bg-white p-5 transition-colors hover:bg-slate-50"
          >
            <h2 class="text-xl font-semibold text-slate-900">提出履歴</h2>
            <p class="mt-2 text-sm text-slate-600">
              問題・グループ・提出時刻を一覧し、詳細に移動します。
            </p>
          </a>
        </section>
      </div>
    </div>
  );
});
