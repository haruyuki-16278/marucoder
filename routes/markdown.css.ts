import { define } from "../utils.ts";
import { CSS, KATEX_CSS } from "@deno/gfm";

// GitHub Flavored Markdown 用の CSS と KaTeX 用の CSS を配信する。
// 問題文等の Markdown / 数式レンダリング表示で利用する。
export const handler = define.handlers({
  GET() {
    return new Response(`${CSS}\n${KATEX_CSS}`, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
});
