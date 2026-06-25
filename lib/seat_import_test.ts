import { assertEquals } from "@std/assert";
import { buildSeatImportResult } from "./seat_import.ts";

Deno.test("seat import: returns parse error when header is missing", () => {
  const csv = "";
  const result = buildSeatImportResult("group_a", csv, new Set(["s001"]));

  assertEquals(result.acceptedCount, 0);
  assertEquals(result.errorCount, 1);
  assertEquals(result.errors[0].line, 1);
});

Deno.test("seat import: detects group mismatch and duplicate coordinates", () => {
  const csv = [
    "groupId,row,col,userId,studentName,label",
    "group_x,1,1,s001,山田,01",
    "group_a,1,2,s001,山田,02",
    "group_a,1,2,s001,山田,03",
  ].join("\n");

  const result = buildSeatImportResult("group_a", csv, new Set(["s001"]));

  assertEquals(result.acceptedCount, 2);
  assertEquals(result.errorCount, 3);
  assertEquals(result.acceptedSeats.length, 0);
});

Deno.test("seat import: detects non-member user", () => {
  const csv = [
    "groupId,row,col,userId,studentName,label",
    "group_a,1,1,s999,誰か,01",
  ].join("\n");

  const result = buildSeatImportResult("group_a", csv, new Set(["s001"]));

  assertEquals(result.acceptedCount, 1);
  assertEquals(result.errorCount, 1);
  assertEquals(result.errors[0].reason.includes("not a member"), true);
  assertEquals(result.acceptedSeats.length, 0);
});

Deno.test("seat import: accepts valid rows", () => {
  const csv = [
    "groupId,row,col,userId,studentName,label",
    "group_a,1,1,s001,山田,01",
    "group_a,1,2,, ,02",
  ].join("\n");

  const result = buildSeatImportResult("group_a", csv, new Set(["s001"]));

  assertEquals(result.acceptedCount, 2);
  assertEquals(result.errorCount, 0);
  assertEquals(result.acceptedSeats.length, 2);
});
