import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>marucoder</title>
      </head>
      <body class="bg-slate-50 text-slate-900">
        <header class="border-b border-slate-200 bg-white">
          <nav class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm">
            <a href="/" class="font-semibold text-slate-700 hover:text-slate-900">ホーム</a>
            <a href="/submissions" class="font-semibold text-slate-700 hover:text-slate-900">提出履歴</a>
            <a href="/teacher/dashboard" class="font-semibold text-slate-700 hover:text-slate-900">教卓進捗</a>
          </nav>
        </header>
        <Component />
      </body>
    </html>
  );
});
