import { define } from "../../../../../utils.ts";
import { requireTeacher } from "../../../../../lib/auth.ts";
import { badRequest, json } from "../../../../../lib/http.ts";
import { getGroup, listGroupMembers, upsertSeats } from "../../../../../lib/group_repo.ts";
import { buildSeatImportResult } from "../../../../../lib/seat_import.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const groupId = ctx.params.groupId;
    const group = await getGroup(groupId);
    if (!group) {
      return json({ code: "GROUP_NOT_FOUND", message: "group was not found" }, 404);
    }

    const contentType = ctx.req.headers.get("content-type") ?? "";
    if (!contentType.includes("text/csv")) {
      return badRequest("INVALID_CONTENT_TYPE", "content-type must be text/csv");
    }

    const csvText = await ctx.req.text();
    const members = await listGroupMembers(groupId);
    const validUserIds = new Set(members.map((member) => member.userId));
    const result = buildSeatImportResult(groupId, csvText, validUserIds);

    const updatedCount = result.acceptedSeats.length > 0 ? await upsertSeats(groupId, result.acceptedSeats) : 0;

    return json({
      acceptedCount: result.acceptedCount,
      updatedCount,
      errorCount: result.errorCount,
      errors: result.errors,
    });
  },
});
