import { define } from "../../../utils.ts";
import { badRequest, getUserId, json } from "../../../lib/http.ts";
import { createGroup } from "../../../lib/group_repo.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json().catch(() => null) as {
      name?: string;
      startsAt?: string;
      endsAt?: string;
    } | null;

    if (!body?.name || body.name.trim() === "") {
      return badRequest("INVALID_REQUEST", "name is required");
    }

    const teacherUserId = getUserId(ctx.req);
    const group = await createGroup({
      name: body.name.trim(),
      teacherUserId,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });

    return json({ groupId: group.id, joinCode: group.joinCode }, 201);
  },
});
