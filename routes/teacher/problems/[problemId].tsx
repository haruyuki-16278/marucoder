import { Head } from "fresh/runtime";
import { define } from "../../../utils.ts";
import { requireTeacher } from "../../../lib/auth.ts";
import {
  archiveProblem,
  createTestCase,
  deleteTestCase,
  getProblem,
  listTestCases,
  setProblemPublished,
  updateProblem,
  updateTestCase,
} from "../../../lib/group_repo.ts";
import { badRequest, notFound } from "../../../lib/http.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const problem = await getProblem(ctx.params.problemId);
    if (!problem) return notFound("PROBLEM_NOT_FOUND", "problem was not found");

    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");

    if (action === "update") {
      const title = String(form.get("title") ?? "").trim();
      const statement = String(form.get("statement") ?? "").trim();
      if (!title || !statement) {
        return badRequest("INVALID_REQUEST", "title and statement are required");
      }
      // Parse samples: alternating input/output pairs from form
      const sampleInputs = form.getAll("sampleInput").map(String);
      const sampleOutputs = form.getAll("sampleOutput").map(String);
      const samples = sampleInputs
        .map((input, i) => ({ input, output: sampleOutputs[i] ?? "" }))
        .filter((s) => s.input.trim() || s.output.trim());

      await updateProblem(ctx.params.problemId, {
        title,
        statement,
        inputSpec: String(form.get("inputSpec") ?? ""),
        outputSpec: String(form.get("outputSpec") ?? ""),
        constraints: String(form.get("constraints") ?? ""),
        samples,
      });
    }

    if (action === "publish" || action === "unpublish") {
      await setProblemPublished(ctx.params.problemId, action === "publish");
    }

    if (action === "archive") {
      await archiveProblem(ctx.params.problemId);
      return new Response(null, { status: 303, headers: { location: "/teacher/problems" } });
    }

    if (action === "add_testcase") {
      const input = String(form.get("tcInput") ?? "");
      const expectedOutput = String(form.get("tcExpected") ?? "");
      const isPublic = form.get("tcPublic") === "on";
      const order = Number(form.get("tcOrder") ?? 0);
      await createTestCase({
        problemId: ctx.params.problemId,
        input,
        expectedOutput,
        isPublic,
        order,
      });
    }

    if (action === "delete_testcase") {
      const tcId = String(form.get("testCaseId") ?? "");
      await deleteTestCase(ctx.params.problemId, tcId);
    }

    if (action === "update_testcase") {
      const tcId = String(form.get("testCaseId") ?? "");
      const input = String(form.get("tcInput") ?? "");
      const expectedOutput = String(form.get("tcExpected") ?? "");
      const isPublic = form.get("tcPublic") === "on";
      const order = Number(form.get("tcOrder") ?? 0);
      await updateTestCase(ctx.params.problemId, tcId, { input, expectedOutput, isPublic, order });
    }

    return new Response(null, {
      status: 303,
      headers: { location: `/teacher/problems/${ctx.params.problemId}` },
    });
  },
});

export default define.page(async function TeacherProblemDetailPage(ctx) {
  const problem = await getProblem(ctx.params.problemId);
  if (!problem) return <div class="p-6 text-rose-700">問題が見つかりません。</div>;

  const testCases = await listTestCases(ctx.params.problemId);

  const statusLabel: Record<string, string> = {
    draft: "下書き",
    published: "公開中",
    archived: "アーカイブ",
  };
  const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    published: "bg-emerald-100 text-emerald-800",
    archived: "bg-rose-100 text-rose-800",
  };

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Head>
        <title>{problem.title} | 問題管理 | marucoder</title>
      </Head>

      <div class="flex items-center gap-3">
        <a href="/teacher/problems" class="text-sm text-slate-500 hover:underline">← 問題一覧</a>
        <span class={`rounded px-2 py-0.5 text-xs ${statusColor[problem.status] ?? ""}`}>
          {statusLabel[problem.status] ?? problem.status}
        </span>
        <span class="text-xs text-slate-500">ID: {problem.id}</span>
      </div>

      {/* 問題編集フォーム */}
      <section class="rounded border border-slate-200 bg-white p-4">
        <h1 class="text-xl font-bold">問題編集</h1>
        <form method="post" class="mt-3 space-y-3">
          <input type="hidden" name="action" value="update" />
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">タイトル</label>
            <input name="title" value={problem.title} required
              class="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">問題文</label>
            <textarea name="statement" rows={8} required
              class="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono">{problem.statement}</textarea>
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">入力仕様</label>
              <textarea name="inputSpec" rows={4}
                class="w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.inputSpec}</textarea>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">出力仕様</label>
              <textarea name="outputSpec" rows={4}
                class="w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.outputSpec}</textarea>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">制約</label>
              <textarea name="constraints" rows={4}
                class="w-full rounded border border-slate-300 px-2 py-1 text-sm">{problem.constraints}</textarea>
            </div>
          </div>
          {/* Samples */}
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">サンプル入出力</label>
            {(problem.samples.length > 0 ? problem.samples : [{ input: "", output: "" }]).map((s, i) => (
              <div key={i} class="mt-2 grid gap-2 md:grid-cols-2">
                <textarea name="sampleInput" rows={3} placeholder={`サンプル${i + 1} 入力`}
                  class="rounded border border-slate-300 px-2 py-1 text-sm font-mono">{s.input}</textarea>
                <textarea name="sampleOutput" rows={3} placeholder={`サンプル${i + 1} 出力`}
                  class="rounded border border-slate-300 px-2 py-1 text-sm font-mono">{s.output}</textarea>
              </div>
            ))}
            <p class="mt-1 text-xs text-slate-500">
              サンプルが1組しか無い場合は上記のみ保存されます。複数追加するにはテストケース欄を使用してください。
            </p>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="rounded bg-slate-900 px-3 py-1 text-sm text-white">保存</button>
          </div>
        </form>

        {/* 公開/非公開/アーカイブ */}
        <div class="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {problem.status !== "published"
            ? (
              <form method="post">
                <input type="hidden" name="action" value="publish" />
                <button type="submit" class="rounded bg-emerald-700 px-3 py-1 text-sm text-white">公開する</button>
              </form>
            )
            : (
              <form method="post">
                <input type="hidden" name="action" value="unpublish" />
                <button type="submit" class="rounded bg-amber-600 px-3 py-1 text-sm text-white">下書きに戻す</button>
              </form>
            )}
          {problem.status !== "archived" && (
            <form method="post">
              <input type="hidden" name="action" value="archive" />
              <button type="submit" class="rounded bg-rose-700 px-3 py-1 text-sm text-white">アーカイブ</button>
            </form>
          )}
        </div>
      </section>

      {/* テストケース */}
      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="text-lg font-semibold">テストケース ({testCases.length}件)</h2>

        {/* 新規追加 */}
        <form method="post" class="mt-3 space-y-2 rounded border border-dashed border-slate-300 p-3">
          <input type="hidden" name="action" value="add_testcase" />
          <p class="text-sm font-medium text-slate-700">新規テストケース追加</p>
          <div class="grid gap-2 md:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs text-slate-500">入力</label>
              <textarea name="tcInput" rows={4}
                class="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">期待出力</label>
              <textarea name="tcExpected" rows={4}
                class="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
            </div>
          </div>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-1 text-sm">
              <input type="checkbox" name="tcPublic" />
              <span>学生に公開する（サンプル表示）</span>
            </label>
            <label class="flex items-center gap-1 text-sm">
              並び順:
              <input type="number" name="tcOrder" value="0"
                class="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
            </label>
            <button type="submit" class="rounded bg-slate-900 px-3 py-1 text-sm text-white">追加</button>
          </div>
        </form>

        {/* 一覧 */}
        {testCases.map((tc, i) => (
          <details key={tc.id} class="mt-3 rounded border border-slate-200">
            <summary class="cursor-pointer rounded px-3 py-2 text-sm hover:bg-slate-50">
              テスト#{i + 1} &nbsp;
              <span class="text-xs text-slate-500">order={tc.order}</span>
              {tc.isPublic && <span class="ml-2 rounded bg-sky-100 px-1 text-xs text-sky-700">公開</span>}
            </summary>
            <div class="border-t border-slate-100 p-3">
              <form method="post" class="space-y-2">
                <input type="hidden" name="action" value="update_testcase" />
                <input type="hidden" name="testCaseId" value={tc.id} />
                <div class="grid gap-2 md:grid-cols-2">
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">入力</label>
                    <textarea name="tcInput" rows={4}
                      class="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono">{tc.input}</textarea>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs text-slate-500">期待出力</label>
                    <textarea name="tcExpected" rows={4}
                      class="w-full rounded border border-slate-300 px-2 py-1 text-sm font-mono">{tc.expectedOutput}</textarea>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <label class="flex items-center gap-1 text-sm">
                    <input type="checkbox" name="tcPublic" checked={tc.isPublic} />
                    <span>学生に公開</span>
                  </label>
                  <label class="flex items-center gap-1 text-sm">
                    並び順:
                    <input type="number" name="tcOrder" value={tc.order}
                      class="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
                  </label>
                  <button type="submit" class="rounded border border-slate-300 px-3 py-1 text-sm">更新</button>
                </div>
              </form>
              <form method="post" class="mt-2">
                <input type="hidden" name="action" value="delete_testcase" />
                <input type="hidden" name="testCaseId" value={tc.id} />
                <button type="submit" class="rounded bg-rose-700 px-3 py-1 text-sm text-white">削除</button>
              </form>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
});
