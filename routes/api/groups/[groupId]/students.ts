import { define } from "../../../../utils.ts";
import { requireTeacher } from "../../../../lib/auth.ts";
import { badRequest, json, notFound } from "../../../../lib/http.ts";
import { getGroup, addStudentsToGroup } from "../../../../lib/group_repo.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authError = requireTeacher(ctx.state);
    if (authError) return authError;

    const groupId = ctx.params.groupId;
    const group = await getGroup(groupId);
    if (!group) return notFound("GROUP_NOT_FOUND", "group was not found");

    const body = await ctx.req.json().catch(() => null) as {
      students?: Array<{ userId?: string; displayName?: string }>;
    } | null;

    const students = body?.students ?? [];
    if (!Array.isArray(students) || students.length === 0) {
      return badRequest("INVALID_REQUEST", "students array is required and must not be empty");
    }

    const validated: Array<{ userId: string; displayName?: string }> = [];
    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const userId = s?.userId?.trim();
      if (!userId) {
        errors.push(`Row ${i + 1}: userId is required`);
        continue;
      }
      const displayName = s?.displayName?.trim() || undefined;
      validated.push({ userId, displayName });
    }

    if (errors.length > 0) {
      return badRequest("INVALID_REQUEST", `Validation errors: ${errors.join("; ")}`);
    }

    const members = await addStudentsToGroup(groupId, validated);

    return json({ addedCount: members.length, members }, 201);
  },
});
