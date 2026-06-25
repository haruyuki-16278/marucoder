import { assert, assertEquals } from "@std/assert";
import { addStudentToGroup, createGroup, createSubmission, upsertSeats } from "../lib/group_repo.ts";

async function waitForServer(baseUrl: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api2/e2e`);
      if (res.ok) return;
    } catch {
      // Retry until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

const RUN_E2E = Deno.env.get("RUN_E2E") === "1";

Deno.test({
  name: "teacher dashboard e2e: problem switch, polling update, seat click",
  ignore: !RUN_E2E,
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const root = new URL("..", import.meta.url).pathname;
    const port = 8877;
    const baseUrl = `http://127.0.0.1:${port}`;

    const server = new Deno.Command("deno", {
      cwd: root,
      args: ["run", "-A", "--unstable-kv", "npm:vite", "--host", "127.0.0.1", "--port", String(port)],
      stdout: "inherit",
      stderr: "inherit",
    }).spawn();

    let browser: Awaited<ReturnType<(typeof import("playwright"))["chromium"]["launch"]>> | null = null;

    try {
      await waitForServer(baseUrl);

      const teacherId = `teacher_${crypto.randomUUID().slice(0, 8)}`;
      const testId = crypto.randomUUID().slice(0, 8);
      const groupName = `E2E-${testId}`;
      const s1 = `s1_${testId}`;
      const s2 = `s2_${testId}`;
      const s1Name = `山田_${testId}`;
      const s2Name = `佐藤_${testId}`;

      const group = await createGroup({
        name: groupName,
        teacherUserId: teacherId,
      });
      await addStudentToGroup({ groupId: group.id, userId: s1, displayName: s1Name });
      await addStudentToGroup({ groupId: group.id, userId: s2, displayName: s2Name });
      await upsertSeats(group.id, [
        { row: 1, col: 1, userId: s1, label: "01" },
        { row: 1, col: 2, userId: s2, label: "02" },
      ]);

      await createSubmission({
        userId: s1,
        groupId: group.id,
        problemId: "A-01",
        verdict: "AC",
      });

      const { chromium } = await import("playwright");
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${baseUrl}/teacher/dashboard?problemId=A-01`);
      await page.waitForSelector("text=教卓進捗ダッシュボード");
      await page.click(`text=${groupName}`);

      await page.waitForSelector("text=50%");

      const problemInput = page.locator('input[value="A-01"]');
      await problemInput.fill("B-01");
      await page.waitForSelector("text=0%", { timeout: 5_000 });

      await problemInput.fill("A-01");
      await page.waitForSelector("text=50%", { timeout: 5_000 });

      await createSubmission({
        userId: s2,
        groupId: group.id,
        problemId: "A-01",
        verdict: "AC",
      });

      await page.waitForSelector("text=100%", { timeout: 15_000 });

      await page.click(`text=${s1Name}`);
      await page.waitForURL(/\/submissions\?userId=/);
      const moved = new URL(page.url());
      assert(moved.pathname.endsWith("/submissions"));
      assertEquals(moved.searchParams.get("userId"), s1);

      await context.close();
    } finally {
      if (browser) {
        await browser.close();
      }
      server.kill();
      await server.status;
    }
  },
});
