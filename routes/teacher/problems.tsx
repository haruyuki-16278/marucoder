import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { requireTeacher } from "../../lib/auth.ts";
import { archiveProblem, createProblem, listProblems, setProblemPublished, updateProblem } from "../../lib/group_repo.ts";
import { badRequest } from "../../lib/http.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;
    return ctx.render(null);
  },

  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");

    if (action === "create") {
      const title = String(form.get("title") ?? "").trim();
      const statement = String(form.get("statement") ?? "").trim();
      const inputSpec = String(form.get("inputSpec") ?? "").trim();
      const outputSpec = String(form.get("outputSpec") ?? "").trim();
      const constraints = String(form.get("constraints") ?? "").trim();

      if (!title || !statement) {
        return badRequest("INVALID_REQUEST", "title and statement are required");
      }

      await createProblem({
        title,
        statement,
        inputSpec,
        outputSpec,
        constraints,
        authorUserId: ctx.state.auth.userId,
      });
    }

    if (action === "publish" || action === "unpublish") {
      const problemId = String(form.get("problemId") ?? "");
      await setProblemPublished(problemId, action === "publish");
    }

    if (action === "archive") {
      const problemId = String(form.get("problemId") ?? "");
      await archiveProblem(problemId);
    }

    if (action === "update") {
      const problemId = String(form.get("problemId") ?? "");
      const title = String(form.get("title") ?? "").trim();
      const statement = String(form.get("statement") ?? "").trim();
      const inputSpec = String(form.get("inputSpec") ?? "").trim();
      const outputSpec = String(form.get("outputSpec") ?? "").trim();
      const constraints = String(form.get("constraints") ?? "").trim();

      await updateProblem(problemId, {
        title: title || undefined,
        statement: statement || undefined,
        inputSpec,
        outputSpec,
        constraints,
      });
    }

    return new Response(null, {
      status: 303,
      headers: { location: "/teacher/problems" },
    });
  },
});

export default define.page(async function TeacherProblemsPage() {
  const problems = await listProblems({ includeArchived: true });

  return (
    <div class="mx-auto max-w-6xl px-4 py-6">
      <Head>
        <title>問題管理 | marucoder</title>
      </Head>
      <h1 class="text-2xl font-bold">問題管理</h1>

      <section class="mt-4 rounded border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold">新規問題作成</h2>
        <form method="post" class="mt-3 space-y-2">
          <input type="hidden" name="action" value="create" />
          <input name="title" placeholder="タイトル" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" required />
          <textarea name="statement" placeholder="問題文" class="h-28 w-full rounded border border-slate-300 px-2 py-1 text-sm" required />
          <textarea name="inputSpec" placeholder="入力仕様" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <textarea name="outputSpec" placeholder="出力仕様" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <textarea name="constraints" placeholder="制約" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <button type="submit" class="rounded bg-slate-900 px-3 py-1 text-sm text-white">作成</button>
        </form>
      </section>

      <section class="mt-4 space-y-3">
        {problems.length === 0
          ? <p class="rounded border border-slate-200 bg-white p-4 text-slate-500">問題はまだありません。</p>
          : problems.map((problem) => (
            <article key={problem.id} class="rounded border border-slate-200 bg-white p-4">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold">{problem.title}</h2>
                <span class="rounded px-2 py-0.5 text-xs bg-slate-100 text-slate-700">{problem.status}</span>
                <span class="text-xs text-slate-500">ID: {problem.id}</span>
              </div>

              <form method="post" class="mt-3 space-y-2">
                <input type="hidden" name="action" value="update" />
                <input type="hidden" name="problemId" value={problem.id} />
                <input name="title" value={problem.title} class="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                <textarea name="statement" class="h-24 w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.statement}</textarea>
                <textarea name="inputSpec" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.inputSpec}</textarea>
                <textarea name="outputSpec" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.outputSpec}</textarea>
                <textarea name="constraints" class="h-16 w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.constraints}</textarea>
                <button type="submit" class="rounded border border-slate-300 px-3 py-1 text-sm">更新</button>
              </form>

              <div class="mt-2 flex flex-wrap gap-2">
                {problem.status !== "published"
                  ? (
                    <form method="post">
                      <input type="hidden" name="action" value="publish" />
                      <input type="hidden" name="problemId" value={problem.id} />
                      <button type="submit" class="rounded bg-emerald-700 px-3 py-1 text-sm text-white">公開</button>
                    </form>
                  )
                  : (
                    <form method="post">
                      <input type="hidden" name="action" value="unpublish" />
                      <input type="hidden" name="problemId" value={problem.id} />
                      <button type="submit" class="rounded bg-amber-700 px-3 py-1 text-sm text-white">下書きに戻す</button>
                    </form>
                  )}
                <form method="post">
                  <input type="hidden" name="action" value="archive" />
                  <input type="hidden" name="problemId" value={problem.id} />
                  <button type="submit" class="rounded bg-rose-700 px-3 py-1 text-sm text-white">アーカイブ</button>
                </form>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
});
