import { define } from "../../../../../utils.ts";
import { badRequest, json } from "../../../../../lib/http.ts";
import { buildSeatProgress } from "../../../../../lib/dashboard.ts";
import { listGroupMembers, upsertSeats } from "../../../../../lib/group_repo.ts";
import { validateSeatInputs } from "../../../../../lib/seat_validation.ts";

type SeatInput = {
  row: number;
  col: number;
  userId?: string;
  label?: string;
};

export const handler = define.handlers({
  async GET(ctx) {
    const url = new URL(ctx.req.url);
    const problemId = url.searchParams.get("problemId")?.trim();

    if (!problemId) {
      return badRequest("INVALID_REQUEST", "problemId is required");
    }

    const seatProgress = await buildSeatProgress(ctx.params.groupId, problemId);
    return json(seatProgress);
  },

  async PUT(ctx) {
    const body = await ctx.req.json().catch(() => null) as { seats?: SeatInput[] } | null;
    const seats = body?.seats;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return badRequest("INVALID_REQUEST", "seats is required and must be a non-empty array");
    }

    const members = await listGroupMembers(ctx.params.groupId);
    const validUserIds = new Set(members.map((member) => member.userId));
    const errors = validateSeatInputs(seats, validUserIds);

    if (errors.length > 0) {
      return json({
        code: "INVALID_SEAT_LAYOUT",
        message: "Seat validation failed",
        details: errors.map((error) => error.reason).join("; "),
      }, 400);
    }

    const updatedCount = await upsertSeats(ctx.params.groupId, seats);
    return json({ updatedCount });
  },
});
