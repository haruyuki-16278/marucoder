import { define } from "../utils.ts";
import { CSS, KATEX_CSS } from "@deno/gfm";

// GitHub Flavored Markdown 用の CSS と KaTeX 用の CSS を配信する。
// 問題文等の Markdown / 数式レンダリング表示で利用する。
const body = `${CSS}\n${KATEX_CSS}`;

// CSS 内容に基づく ETag を生成する。
// CSS が変わると ETag も変わるため、ブラウザは古い CSS を使い続けない。
// （古い CSS のまま新しい HTML を表示すると KaTeX の MathML と HTML が
//   二重表示されるため、再検証を強制する）
let etagCache: string | null = null;
async function getEtag(): Promise<string> {
  if (etagCache) return etagCache;
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(body),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  etagCache = `"${hex}"`;
  return etagCache;
}

export const handler = define.handlers({
  async GET(ctx) {
    const etag = await getEtag();

    // 内容が一致すれば 304 を返して転送量を抑える。
    if (ctx.req.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          "etag": etag,
          "cache-control": "no-cache",
        },
      });
    }

    return new Response(body, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        // no-cache: キャッシュは保持するが使用前に必ず再検証する。
        // ETag が変われば新しい CSS を取得するため二重表示を防げる。
        "cache-control": "no-cache",
        "etag": etag,
      },
    });
  },
});
