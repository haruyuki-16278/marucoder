import { define } from "../../../../../utils.ts";
import { requireTeacher } from "../../../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../../../lib/http.ts";
import { deleteTestCase, getProblem, getTestCase, updateTestCase } from "../../../../../lib/group_repo.ts";

export const handler = define.handlers({
  async PUT(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const problem = await getProblem(ctx.params.problemId);
    if (!problem) return notFound("PROBLEM_NOT_FOUND", "problem was not found");

    const body = await ctx.req.json().catch(() => null) as {
      input?: string;
      expectedOutput?: string;
      isPublic?: boolean;
      order?: number;
    } | null;

    if (!body) return badRequest("INVALID_REQUEST", "json body is required");

    const next = await updateTestCase(ctx.params.problemId, ctx.params.testCaseId, {
      input: body.input,
      expectedOutput: body.expectedOutput,
      isPublic: body.isPublic,
      order: body.order,
    });

    if (!next) return notFound("TEST_CASE_NOT_FOUND", "test case was not found");
    return json(next);
  },

  async DELETE(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const problem = await getProblem(ctx.params.problemId);
    if (!problem) return notFound("PROBLEM_NOT_FOUND", "problem was not found");

    const deleted = await deleteTestCase(ctx.params.problemId, ctx.params.testCaseId);
    if (!deleted) return notFound("TEST_CASE_NOT_FOUND", "test case was not found");
    return json({ ok: true });
  },
});
