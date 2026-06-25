import { define } from "../../../utils.ts";
import { json, notFound } from "../../../lib/http.ts";
import { getSubmissionById } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const submission = await getSubmissionById(ctx.params.submissionId);
    if (!submission) {
      return notFound("SUBMISSION_NOT_FOUND", "submission was not found");
    }
    return json(submission);
  },
});
