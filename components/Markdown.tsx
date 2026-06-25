import { render } from "@deno/gfm";

export interface MarkdownProps {
  source: string;
  /** 追加の class 名（コンテナ div に付与） */
  class?: string;
  /** インライン（段落ラップ無し）でレンダリングする */
  inline?: boolean;
}

/**
 * Markdown 文字列をサニタイズ済み HTML としてレンダリングするコンポーネント。
 * @deno/gfm の render はデフォルトで HTML サニタイズを行うため XSS 安全。
 * KaTeX 記法（$...$ / $$...$$）による数式にも対応する。
 * スタイルは /markdown.css（GFM CSS + KaTeX CSS）に依存する。
 */
export function Markdown({ source, class: className, inline }: MarkdownProps) {
  const html = render(source ?? "", { inline, allowMath: true });
  return (
    <div
      data-color-mode="light"
      data-light-theme="light"
      data-dark-theme="dark"
      class={`markdown-body ${className ?? ""}`.trim()}
      // deno-lint-ignore react-no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
