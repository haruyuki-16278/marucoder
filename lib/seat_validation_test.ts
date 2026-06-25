import { assertEquals } from "@std/assert";
import { validateSeatInputs } from "./seat_validation.ts";

Deno.test("validateSeatInputs: detects duplicate coordinates", () => {
  const seats = [
    { row: 1, col: 1, userId: "s1" },
    { row: 1, col: 1, userId: "s2" },
  ];

  const errors = validateSeatInputs(seats, new Set(["s1", "s2"]), [2, 3]);
  assertEquals(errors.some((e) => e.reason.includes("duplicate seat coordinates")), true);
});

Deno.test("validateSeatInputs: detects out-of-range row/col", () => {
  const seats = [{ row: 0, col: 101, userId: "s1" }];
  const errors = validateSeatInputs(seats, new Set(["s1"]), [2]);

  assertEquals(errors.some((e) => e.reason.includes("row must be")), true);
  assertEquals(errors.some((e) => e.reason.includes("col must be")), true);
});

Deno.test("validateSeatInputs: detects non-member user", () => {
  const seats = [{ row: 1, col: 1, userId: "s999" }];
  const errors = validateSeatInputs(seats, new Set(["s1"]), [2]);

  assertEquals(errors.some((e) => e.reason.includes("not a member")), true);
});

Deno.test("validateSeatInputs: valid input has no errors", () => {
  const seats = [
    { row: 1, col: 1, userId: "s1" },
    { row: 1, col: 2, label: "02" },
  ];
  const errors = validateSeatInputs(seats, new Set(["s1"]), [2, 3]);
  assertEquals(errors.length, 0);
});
