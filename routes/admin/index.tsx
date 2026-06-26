import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";

export default define.page(function AdminPage() {
  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <Head>
        <title>管理画面 | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">管理画面</h1>
      <p class="mt-2 text-sm text-slate-600">admin は教員・学生のCSV一括登録ができます。結果はJSONで返ります。</p>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <form method="post" action="/api/users/import/teachers" class="rounded border border-slate-200 bg-white p-4">
          <h2 class="text-lg font-semibold">教員CSV一括登録</h2>
          <p class="mt-1 text-xs text-slate-500">ヘッダ: lastNameRoma,firstNameRoma,email</p>
          <textarea
            name="csv"
            class="mt-3 h-48 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            defaultValue="lastNameRoma,firstNameRoma,email\nyamaji,toshiyuki,yamaji@example.com"
          />
          <button type="submit" class="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white">教員を登録</button>
        </form>

        <form method="post" action="/api/users/import/students" class="rounded border border-slate-200 bg-white p-4">
          <h2 class="text-lg font-semibold">学生CSV一括登録</h2>
          <p class="mt-1 text-xs text-slate-500">ヘッダ: grade,attendanceNo</p>
          <textarea
            name="csv"
            class="mt-3 h-48 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
            defaultValue="grade,attendanceNo\n1,3\n1,4"
          />
          <button type="submit" class="mt-3 rounded bg-slate-900 px-3 py-1 text-sm text-white">学生を登録</button>
        </form>
      </div>
    </div>
  );
});
