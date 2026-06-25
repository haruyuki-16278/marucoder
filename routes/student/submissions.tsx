import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { requireStudent } from "../../lib/auth.ts";
import { listSubmissions } from "../../lib/group_repo.ts";

export const handler = define.handlers({
  GET(ctx) {
    const authError = requireStudent(ctx.state);
    if (authError) return authError;
    return ctx.render(null);
  },
});

export default define.page(async function StudentSubmissionsPage(ctx) {
  const submissions = await listSubmissions({ userId: ctx.state.auth.userId });

  return (
    <div class="mx-auto max-w-5xl px-4 py-6">
      <Head>
        <title>自分の提出 | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">自分の提出</h1>
      <p class="mt-2 text-sm text-slate-600">ユーザー: {ctx.state.auth.userId}</p>

      <div class="mt-4 overflow-auto rounded border border-slate-200 bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-left">
              <th class="px-3 py-2">提出ID</th>
              <th class="px-3 py-2">問題</th>
              <th class="px-3 py-2">判定</th>
              <th class="px-3 py-2">提出時刻</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0
              ? (
                <tr>
                  <td class="px-3 py-4 text-slate-500" colspan={4}>提出データはまだありません。</td>
                </tr>
              )
              : submissions.map((s) => (
                <tr key={s.id} class="border-b border-slate-100">
                  <td class="px-3 py-2">{s.id}</td>
                  <td class="px-3 py-2">{s.problemId}</td>
                  <td class="px-3 py-2">{s.verdict ?? "-"}</td>
                  <td class="px-3 py-2">{new Date(s.createdAt).toLocaleString("ja-JP")}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
