import { Head } from "fresh/runtime";
import { define } from "../../../utils.ts";
import { getProblem, listTestCases } from "../../../lib/group_repo.ts";
import { Markdown } from "../../../components/Markdown.tsx";

export default define.page(async function StudentProblemDetailPage(ctx) {
  const problem = await getProblem(ctx.params.problemId);
  if (!problem || problem.status !== "published") {
    return (
      <div class="mx-auto max-w-5xl px-4 py-8">
        <Head><title>問題が見つかりません | marucoder</title></Head>
        <p class="text-rose-700">問題が見つかりません。</p>
        <a href="/student/problems" class="mt-3 block text-sm text-sky-700 hover:underline">← 問題一覧に戻る</a>
      </div>
    );
  }

  const allTestCases = await listTestCases(problem.id);
  const publicTestCases = allTestCases.filter((tc) => tc.isPublic);

  return (
    <div class="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Head>
        <title>{problem.title} | marucoder</title>
        <link rel="stylesheet" href="/markdown.css" />
      </Head>

      <div>
        <a href="/student/problems" class="text-sm text-slate-500 hover:underline">← 問題一覧</a>
        <h1 class="mt-1 text-2xl font-bold">{problem.title}</h1>
      </div>

      {/* 問題文 */}
      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-2 font-semibold">問題文</h2>
        <Markdown source={problem.statement} />
      </section>

      {/* 仕様 */}
      {(problem.inputSpec || problem.outputSpec || problem.constraints) && (
        <div class="grid gap-4 md:grid-cols-3">
          {problem.inputSpec && (
            <section class="rounded border border-slate-200 bg-white p-3">
              <h3 class="mb-1 text-sm font-semibold">入力仕様</h3>
              <Markdown source={problem.inputSpec} />
            </section>
          )}
          {problem.outputSpec && (
            <section class="rounded border border-slate-200 bg-white p-3">
              <h3 class="mb-1 text-sm font-semibold">出力仕様</h3>
              <Markdown source={problem.outputSpec} />
            </section>
          )}
          {problem.constraints && (
            <section class="rounded border border-slate-200 bg-white p-3">
              <h3 class="mb-1 text-sm font-semibold">制約</h3>
              <Markdown source={problem.constraints} />
            </section>
          )}
        </div>
      )}

      {/* サンプル（Problemに設定されたもの） */}
      {problem.samples.length > 0 && (
        <section class="rounded border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold">サンプル</h2>
          {problem.samples.map((s, i) => (
            <div key={i} class="mt-3 grid gap-2 md:grid-cols-2">
              <div>
                <p class="mb-1 text-xs text-slate-500">サンプル入力 #{i + 1}</p>
                <pre class="rounded bg-slate-50 p-2 text-xs">{s.input}</pre>
              </div>
              <div>
                <p class="mb-1 text-xs text-slate-500">サンプル出力 #{i + 1}</p>
                <pre class="rounded bg-slate-50 p-2 text-xs">{s.output}</pre>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 公開テストケース */}
      {publicTestCases.length > 0 && (
        <section class="rounded border border-slate-200 bg-white p-4">
          <h2 class="mb-3 font-semibold">公開テストケース</h2>
          {publicTestCases.map((tc, i) => (
            <div key={tc.id} class="mt-3 grid gap-2 md:grid-cols-2">
              <div>
                <p class="mb-1 text-xs text-slate-500">入力 #{i + 1}</p>
                <pre class="rounded bg-slate-50 p-2 text-xs">{tc.input}</pre>
              </div>
              <div>
                <p class="mb-1 text-xs text-slate-500">期待出力 #{i + 1}</p>
                <pre class="rounded bg-slate-50 p-2 text-xs">{tc.expectedOutput}</pre>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 提出フォーム */}
      <section class="rounded border border-slate-200 bg-white p-4">
        <h2 class="mb-3 font-semibold">提出</h2>
        <div id="submit-result" class="mb-2 hidden rounded border border-slate-200 p-2 text-sm" />
        <form id="submit-form" class="space-y-2">
          <textarea id="source-code" rows={14} placeholder="C言語のソースコードを貼り付けてください"
            class="w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm" />
          <button type="submit"
            class="rounded bg-slate-900 px-4 py-1.5 text-sm text-white disabled:opacity-50">提出</button>
        </form>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  const form = document.getElementById('submit-form');
  const resultBox = document.getElementById('submit-result');
  const codeArea = document.getElementById('source-code');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '提出中...';
    resultBox.className = 'mb-2 rounded border border-slate-200 p-2 text-sm';
    resultBox.textContent = '判定中...';
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ problemId: '${problem.id}', language: 'c', sourceCode: codeArea.value }),
      });
      const data = await res.json();
      if (!res.ok) { resultBox.textContent = 'エラー: ' + (data.message ?? res.status); return; }
      const sid = data.submissionId;
      resultBox.textContent = '受付: ' + sid + ' (判定中...)';
      // Poll until DONE/ERROR
      const poll = setInterval(async () => {
        const r2 = await fetch('/api/submissions/' + sid);
        if (!r2.ok) { clearInterval(poll); return; }
        const s = await r2.json();
        if (s.status === 'DONE' || s.status === 'ERROR') {
          clearInterval(poll);
          resultBox.textContent = '結果: ' + (s.verdict ?? s.status) + ' (ID: ' + sid + ')';
          resultBox.className = 'mb-2 rounded border p-2 text-sm ' + (s.verdict === 'AC' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800');
        }
      }, 2000);
    } finally {
      btn.disabled = false;
      btn.textContent = '提出';
    }
  });
})();
`,
          }}
        />
      </section>
    </div>
  );
});
