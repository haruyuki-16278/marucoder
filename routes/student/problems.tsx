import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { requireStudent } from "../../lib/auth.ts";
import { listProblems } from "../../lib/group_repo.ts";

export const handler = define.handlers({
  GET(ctx) {
    const authError = requireStudent(ctx.state);
    if (authError) return authError;
    return ctx.render(null);
  },
});

export default define.page(async function StudentProblemsPage() {
  const problems = await listProblems({ onlyPublished: true });

  return (
    <div class="mx-auto max-w-5xl px-4 py-6">
      <Head>
        <title>問題一覧 | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">公開問題一覧</h1>
      <p class="mt-2 text-sm text-slate-600">公開中の問題のみ表示しています。</p>

      <div class="mt-4 space-y-3">
        {problems.length === 0
          ? <p class="rounded border border-slate-200 bg-white p-4 text-slate-500">公開中の問題はまだありません。</p>
          : problems.map((problem) => (
            <article key={problem.id} class="rounded border border-slate-200 bg-white p-4">
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-lg font-semibold">
                  <a href={`/student/problems/${problem.id}`} class="hover:underline">{problem.title}</a>
                </h2>
                <span class="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">公開中</span>
              </div>
              <p class="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">{problem.statement}</p>
              <a href={`/student/problems/${problem.id}`}
                class="mt-2 inline-block text-xs text-sky-700 hover:underline">問題を解く →</a>
            </article>
          ))}
      </div>
    </div>
  );
});
