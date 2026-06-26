import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { listProblems, listSubmissions } from "../lib/group_repo.ts";

export default define.page(async function SubmissionsPage(ctx) {
  const url = new URL(ctx.req.url);
  const requestedUserId = url.searchParams.get("userId") ?? undefined;
  const problemId = url.searchParams.get("problemId") ?? undefined;
  const verdict = url.searchParams.get("verdict") ?? undefined;
  const userId = (ctx.state.auth.role === "teacher" || ctx.state.auth.role === "admin")
    ? requestedUserId
    : ctx.state.auth.userId;

  const submissions = await listSubmissions({ userId, problemId, verdict });
  const problems = await listProblems({ includeArchived: true });
  const problemNameById = new Map(problems.map((problem) => [problem.id, problem.title]));

  return (
    <div class="mx-auto max-w-4xl px-4 py-6">
      <Head>
        <title>提出履歴 | marucoder</title>
      </Head>
      <h1 class="mb-2 text-xl font-bold">提出履歴</h1>
      <p class="mb-4 text-sm text-slate-600">
        フィルタ: 出席番号={userId ?? "-"}, problemId={problemId ?? "-"}, verdict={verdict ?? "-"}
      </p>

      <div class="overflow-auto rounded border border-slate-200 bg-white">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-left">
              <th class="px-3 py-2">ID</th>
              <th class="px-3 py-2">出席番号</th>
              <th class="px-3 py-2">問題</th>
              <th class="px-3 py-2">判定</th>
              <th class="px-3 py-2">提出時刻</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0
              ? (
                <tr>
                  <td class="px-3 py-4 text-slate-500" colspan={5}>提出データはまだありません。</td>
                </tr>
              )
              : submissions.map((s) => (
                <tr key={s.id} class="border-b border-slate-100">
                  <td class="px-3 py-2">{s.id}</td>
                  <td class="px-3 py-2">{s.userId}</td>
                  <td class="px-3 py-2">{problemNameById.get(s.problemId) ?? s.problemId}</td>
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
