import { define } from "../../../utils.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { forbidden, json, notFound } from "../../../lib/http.ts";
import { getSubmissionById } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const authError = requireAuth(ctx.state);
    if (authError) return authError;

    const submission = await getSubmissionById(ctx.params.submissionId);
    if (!submission) {
      return notFound("SUBMISSION_NOT_FOUND", "submission was not found");
    }

    if (ctx.state.auth.role === "student" && submission.userId !== ctx.state.auth.userId) {
      return forbidden("FORBIDDEN", "students can only access their own submissions");
    }

    return json(submission);
  },
});
