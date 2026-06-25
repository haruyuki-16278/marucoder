import { define } from "../utils.ts";
import { CSS } from "@deno/gfm";

// GitHub Flavored Markdown 用の CSS を配信する。
// 問題文等の Markdown レンダリング表示で利用する。
export const handler = define.handlers({
  GET() {
    return new Response(CSS, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  },
});
