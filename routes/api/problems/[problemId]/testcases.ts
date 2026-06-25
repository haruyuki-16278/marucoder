import { define } from "../../../../utils.ts";
import { requireAuth, requireTeacher } from "../../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../../lib/http.ts";
import {
  createTestCase,
  deleteTestCase,
  getProblem,
  listTestCases,
  updateTestCase,
} from "../../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const problem = await getProblem(ctx.params.problemId);
    if (!problem) return notFound("PROBLEM_NOT_FOUND", "problem was not found");

    if (ctx.state.auth.role !== "teacher" && problem.status !== "published") {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    const tcs = await listTestCases(ctx.params.problemId);
    const filtered = ctx.state.auth.role === "teacher" ? tcs : tcs.filter((tc) => tc.isPublic);
    return json(filtered);
  },

  async POST(ctx) {
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

    if (typeof body?.input !== "string" || typeof body?.expectedOutput !== "string") {
      return badRequest("INVALID_REQUEST", "input and expectedOutput are required");
    }

    const tc = await createTestCase({
      problemId: ctx.params.problemId,
      input: body.input,
      expectedOutput: body.expectedOutput,
      isPublic: body.isPublic ?? false,
      order: body.order ?? 0,
    });

    return json(tc, 201);
  },
});
