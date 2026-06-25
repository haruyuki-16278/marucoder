import { define } from "../../../../utils.ts";
import { badRequest, json, notFound } from "../../../../lib/http.ts";
import { getGroup, listGroupMembers, listSeats, type SeatInput, upsertSeats } from "../../../../lib/group_repo.ts";
import { validateSeatInputs } from "../../../../lib/seat_validation.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const group = await getGroup(ctx.params.groupId);
    if (!group) {
      return notFound("GROUP_NOT_FOUND", "group was not found");
    }

    const seats = await listSeats(group.id);
    return json(seats);
  },

  async PUT(ctx) {
    const group = await getGroup(ctx.params.groupId);
    if (!group) {
      return notFound("GROUP_NOT_FOUND", "group was not found");
    }

    const body = await ctx.req.json().catch(() => null) as { seats?: SeatInput[] } | null;
    const seats = body?.seats;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return badRequest("INVALID_REQUEST", "seats is required and must be a non-empty array");
    }

    const members = await listGroupMembers(group.id);
    const validUserIds = new Set(members.map((member) => member.userId));
    const errors = validateSeatInputs(seats, validUserIds);

    if (errors.length > 0) {
      return json({
        code: "INVALID_SEAT_LAYOUT",
        message: "Seat validation failed",
        details: errors.map((error) => error.reason).join("; "),
      }, 400);
    }

    const updatedCount = await upsertSeats(group.id, seats);
    return json({ updatedCount });
  },
});
