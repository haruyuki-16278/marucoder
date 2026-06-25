import { define } from "../../../utils.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../lib/http.ts";
import {
  createSubmission,
  listSubmissions,
  listTestCases,
  getProblem,
  saveCaseResult,
  updateSubmissionStatus,
} from "../../../lib/group_repo.ts";
import { judgeSubmission } from "../../../lib/judge.ts";

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

  async POST(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      problemId?: string;
      language?: string;
      sourceCode?: string;
    } | null;

    const problemId = body?.problemId?.trim();
    const sourceCode = body?.sourceCode?.trim();

    if (!problemId) return badRequest("INVALID_REQUEST", "problemId is required");
    if (!sourceCode) return badRequest("INVALID_REQUEST", "sourceCode is required");
    if (body?.language && body.language !== "c") {
      return badRequest("INVALID_REQUEST", "only language=c is supported");
    }

    const problem = await getProblem(problemId);
    if (!problem) return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    if (ctx.state.auth.role === "student" && problem.status !== "published") {
      return notFound("PROBLEM_NOT_FOUND", "problem was not found");
    }

    const userId = ctx.state.auth.userId;
    const submission = await createSubmission({
      userId,
      groupId: null,
      problemId,
      language: "c",
      sourceCode,
      status: "QUEUED",
      verdict: null,
      compileOutput: "",
    });

    // Run judge asynchronously (fire-and-forget style for MVP)
    (async () => {
      try {
        await updateSubmissionStatus(submission.id, { status: "RUNNING" });
        const testCases = await listTestCases(problemId);
        const result = await judgeSubmission({
          submissionId: submission.id,
          problemId,
          sourceCode,
          testCases,
        });
        for (const cr of result.caseResults) {
          await saveCaseResult(cr);
        }
        await updateSubmissionStatus(submission.id, {
          status: "DONE",
          verdict: result.verdict,
          compileOutput: result.compileOutput,
          finishedAt: new Date().toISOString(),
        });
      } catch {
        await updateSubmissionStatus(submission.id, {
          status: "ERROR",
          verdict: "IE",
          finishedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    })();

    return json({ submissionId: submission.id, status: "QUEUED" }, 202);
  },
});

