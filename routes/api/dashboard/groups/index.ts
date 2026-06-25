import { define } from "../../../../utils.ts";
import { requireTeacher } from "../../../../lib/auth.ts";
import { badRequest, json } from "../../../../lib/http.ts";
import { buildGroupProgress } from "../../../../lib/dashboard.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const url = new URL(ctx.req.url);
    const problemId = url.searchParams.get("problemId")?.trim();

    if (!problemId) {
      return badRequest("INVALID_REQUEST", "problemId is required");
    }

    const snapshots = await buildGroupProgress(problemId);
    return json(snapshots);
  },
});
