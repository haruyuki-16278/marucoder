import { define } from "../../../utils.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { json } from "../../../lib/http.ts";
import { listSubmissions } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const url = new URL(ctx.req.url);
    const problemId = url.searchParams.get("problemId") ?? undefined;
    const requestedUserId = url.searchParams.get("userId") ?? undefined;
    const verdict = url.searchParams.get("verdict") ?? undefined;
    const userId = ctx.state.auth.role === "teacher" ? requestedUserId : ctx.state.auth.userId;

    const submissions = await listSubmissions({
      problemId,
      userId,
      verdict,
    });

    return json(submissions);
  },
});
