import { define } from "../../../../utils.ts";
import { requireTeacher } from "../../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../../lib/http.ts";
import { setProblemPublished } from "../../../../lib/group_repo.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as { publish?: boolean } | null;
    if (typeof body?.publish !== "boolean") {
      return badRequest("INVALID_REQUEST", "publish(boolean) is required");
    }

    const next = await setProblemPublished(ctx.params.problemId, body.publish);
    if (!next) {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    return json(next);
  },
});
