import { define } from "../../../utils.ts";
import { requireAuth, requireTeacher } from "../../../lib/auth.ts";
import { badRequest, json } from "../../../lib/http.ts";
import { createProblem, listProblems } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const problems = ctx.state.auth.role === "teacher"
      ? await listProblems({ includeArchived: true })
      : await listProblems({ onlyPublished: true });

    return json(problems);
  },

  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      title?: string;
      statement?: string;
      inputSpec?: string;
      outputSpec?: string;
      constraints?: string;
    } | null;

    const title = body?.title?.trim();
    const statement = body?.statement?.trim();

    if (!title) {
      return badRequest("INVALID_REQUEST", "title is required");
    }
    if (!statement) {
      return badRequest("INVALID_REQUEST", "statement is required");
    }

    const problem = await createProblem({
      title,
      statement,
      inputSpec: body?.inputSpec,
      outputSpec: body?.outputSpec,
      constraints: body?.constraints,
      authorUserId: ctx.state.auth.userId,
    });

    return json(problem, 201);
  },
});
