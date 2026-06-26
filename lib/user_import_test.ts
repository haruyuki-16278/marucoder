import { assertEquals } from "@std/assert";
import { importStudentsCsv, importTeachersCsv } from "./user_import.ts";

Deno.test("import teachers: partial success and duplicate failure", async () => {
  const letters = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((n) => String.fromCharCode(97 + (n % 26)))
    .join("");
  const csv = [
    "lastNameRoma,firstNameRoma,email",
    `${letters},alpha,a@example.com`,
    `${letters},alpha,b@example.com`,
  ].join("\n");

  const report = await importTeachersCsv(csv);
  assertEquals(report.successCount, 1);
  assertEquals(report.failedCount, 1);
});

Deno.test("import students: header and zero-pad ids", async () => {
  const n1 = (crypto.getRandomValues(new Uint8Array(1))[0] % 90) + 10;
  const n2 = n1 === 99 ? 98 : n1 + 1;
  const csv = [
    "grade,attendanceNo",
    `9,${n1}`,
    `9,${n2}`,
  ].join("\n");

  const report = await importStudentsCsv(csv);
  assertEquals(report.successCount + report.failedCount, 2);
});
