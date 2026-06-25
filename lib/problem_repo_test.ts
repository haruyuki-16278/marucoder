import { assertEquals, assertExists } from "@std/assert";
import {
  archiveProblem,
  createProblem,
  getProblem,
  listProblems,
  setProblemPublished,
  updateProblem,
} from "./group_repo.ts";

Deno.test({
  name: "problem repo: create/update/publish/archive flow",
  ignore: typeof Deno.openKv !== "function",
  fn: async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const created = await createProblem({
      title: `P-${suffix}`,
      statement: "statement",
      authorUserId: "teacher-test",
      inputSpec: "input",
      outputSpec: "output",
      constraints: "constraints",
    });

    assertEquals(created.status, "draft");

    const updated = await updateProblem(created.id, {
      title: `P2-${suffix}`,
      statement: "updated",
    });
    assertExists(updated);
    assertEquals(updated.title, `P2-${suffix}`);

    const published = await setProblemPublished(created.id, true);
    assertExists(published);
    assertEquals(published.status, "published");

    const fetched = await getProblem(created.id);
    assertExists(fetched);
    assertEquals(fetched.id, created.id);

    const publishedOnly = await listProblems({ onlyPublished: true });
    const hasPublished = publishedOnly.some((problem) => problem.id === created.id);
    assertEquals(hasPublished, true);

    const archived = await archiveProblem(created.id);
    assertExists(archived);
    assertEquals(archived.status, "archived");

    const visibleDefault = await listProblems();
    const hasArchivedByDefault = visibleDefault.some((problem) => problem.id === created.id);
    assertEquals(hasArchivedByDefault, false);
  },
});
