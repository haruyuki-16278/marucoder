import { assertEquals, assertThrows } from "@std/assert";
import { makeStudentInitialPassword, makeStudentUsername, makeTeacherUsername } from "./user_rules.ts";

Deno.test("user rules: teacher username", () => {
  assertEquals(makeTeacherUsername("Yamaji", "Toshiyuki"), "yamaji.toshiyuki");
  assertThrows(() => makeTeacherUsername("ya-maji", "toshiyuki"));
});

Deno.test("user rules: student username zero pad", () => {
  assertEquals(makeStudentUsername(1, 3), "103");
  assertEquals(makeStudentUsername(2, 12), "212");
});

Deno.test("user rules: student initial password zero pad", () => {
  assertEquals(makeStudentInitialPassword(3), "marugoto03");
  assertEquals(makeStudentInitialPassword(12), "marugoto12");
});
