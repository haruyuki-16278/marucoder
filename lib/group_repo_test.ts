import { assertEquals } from "@std/assert";
import { listSeats, upsertSeats } from "./group_repo.ts";

Deno.test({
  name: "upsertSeats: returns updatedCount for valid input",
  ignore: typeof Deno.openKv !== "function",
  fn: async () => {
  const groupId = `test_group_${crypto.randomUUID()}`;
  const updatedCount = await upsertSeats(groupId, [
    { row: 1, col: 1, userId: "s1", label: "01" },
    { row: 1, col: 2, label: "02" },
  ]);

  assertEquals(updatedCount, 2);

  const seats = await listSeats(groupId);
  assertEquals(seats.length, 2);
  },
});
