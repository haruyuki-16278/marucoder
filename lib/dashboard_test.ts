import { assertEquals } from "@std/assert";
import { aggregateGroupProgress } from "./dashboard.ts";

Deno.test("aggregateGroupProgress: submitted/ac counts and rate", () => {
  const result = aggregateGroupProgress({
    groupId: "group_a",
    groupName: "A",
    problemId: "A-01",
    studentUserIds: ["s1", "s2", "s3"],
    submissions: [
      { userId: "s1", verdict: "WA", createdAt: "2026-06-25T10:00:00.000Z" },
      { userId: "s2", verdict: "AC", createdAt: "2026-06-25T10:01:00.000Z" },
      { userId: "s1", verdict: "AC", createdAt: "2026-06-25T10:02:00.000Z" },
    ],
  });

  assertEquals(result.submittedStudents, 2);
  assertEquals(result.acStudents, 2);
  assertEquals(result.progressRate, 2 / 3);
  assertEquals(result.lastSubmissionAt, "2026-06-25T10:02:00.000Z");
});

Deno.test("aggregateGroupProgress: totalStudents=0 gives progressRate=0", () => {
  const result = aggregateGroupProgress({
    groupId: "group_empty",
    groupName: "Empty",
    problemId: "A-01",
    studentUserIds: [],
    submissions: [
      { userId: "x", verdict: "AC", createdAt: "2026-06-25T10:00:00.000Z" },
    ],
  });

  assertEquals(result.totalStudents, 0);
  assertEquals(result.progressRate, 0);
});
