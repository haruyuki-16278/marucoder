import { define } from "../../../utils.ts";
import { requireStudent } from "../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../lib/http.ts";
import { addStudentToGroup, getGroupByJoinCode } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireStudent(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      joinCode?: string;
      displayName?: string;
    } | null;

    const joinCode = body?.joinCode?.trim();
    if (!joinCode) {
      return badRequest("INVALID_REQUEST", "joinCode is required");
    }

    const group = await getGroupByJoinCode(joinCode);
    if (!group) {
      return notFound("GROUP_NOT_FOUND", "group was not found by joinCode");
    }

    const userId = ctx.state.auth.userId;
    const member = await addStudentToGroup({
      groupId: group.id,
      userId,
      displayName: body?.displayName,
    });

    return json({ groupId: group.id, role: member.role }, 201);
  },
});
