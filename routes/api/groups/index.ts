import { define } from "../../../utils.ts";
import { requireTeacher } from "../../../lib/auth.ts";
import { badRequest, json } from "../../../lib/http.ts";
import { createGroup } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const body = await ctx.req.json().catch(() => null) as {
      name?: string;
      teacherDisplayName?: string;
      startsAt?: string;
      endsAt?: string;
    } | null;

    if (!body?.name || body.name.trim() === "") {
      return badRequest("INVALID_REQUEST", "name is required");
    }

    const teacherUserId = ctx.state.auth.userId;
    const group = await createGroup({
      name: body.name.trim(),
      teacherUserId,
      teacherDisplayName: body.teacherDisplayName?.trim(),
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });

    return json({ groupId: group.id, joinCode: group.joinCode }, 201);
  },
});
