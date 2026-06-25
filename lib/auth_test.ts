import { assertEquals } from "@std/assert";
import { resolveAuth } from "./auth.ts";

Deno.test("auth: resolve role and user from headers", () => {
  const req = new Request("http://localhost:8000/", {
    headers: {
      "x-user-id": "s001",
      "x-user-role": "student",
    },
  });

  const auth = resolveAuth(req);
  assertEquals(auth.userId, "s001");
  assertEquals(auth.role, "student");
  assertEquals(auth.isAuthenticated, true);
});

Deno.test("auth: query role is accepted", () => {
  const req = new Request("http://localhost:8000/?role=teacher&userId=t001");

  const auth = resolveAuth(req);
  assertEquals(auth.userId, "t001");
  assertEquals(auth.role, "teacher");
  assertEquals(auth.isAuthenticated, true);
});
