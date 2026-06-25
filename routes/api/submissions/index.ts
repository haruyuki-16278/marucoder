import { define } from "../../../utils.ts";
import { json } from "../../../lib/http.ts";
import { listSubmissions } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const problemId = url.searchParams.get("problemId") ?? undefined;
    const userId = url.searchParams.get("userId") ?? undefined;
    const verdict = url.searchParams.get("verdict") ?? undefined;

    const submissions = await listSubmissions({
      problemId,
      userId,
      verdict,
    });

    return json(submissions);
  },
});
