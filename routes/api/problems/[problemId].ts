import { define } from "../../../utils.ts";
import { requireAuth, requireTeacher } from "../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../lib/http.ts";
import { getProblem, updateProblem, archiveProblem } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const problem = await getProblem(ctx.params.problemId);
    if (!problem) {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    if (ctx.state.auth.role !== "teacher" && problem.status !== "published") {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    return json(problem);
  },

  async PUT(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      title?: string;
      statement?: string;
      inputSpec?: string;
      outputSpec?: string;
      constraints?: string;
    } | null;

    if (!body) {
      return badRequest("INVALID_REQUEST", "json body is required");
    }

    const next = await updateProblem(ctx.params.problemId, {
      title: body.title?.trim(),
      statement: body.statement?.trim(),
      inputSpec: body.inputSpec,
      outputSpec: body.outputSpec,
      constraints: body.constraints,
    });

    if (!next) {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    return json(next);
  },

  async DELETE(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const next = await archiveProblem(ctx.params.problemId);
    if (!next) {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    return json(next);
  },
});
