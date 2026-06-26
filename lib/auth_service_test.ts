import { assertEquals } from "@std/assert";
import { authenticate, changePassword } from "./auth_service.ts";
import { hashPassword } from "./password.ts";
import { createUser } from "./user_repo.ts";

Deno.test("auth flow: mustChangePassword true then false after change", async () => {
  const username = `s${crypto.randomUUID().slice(0, 6)}`;
  const initialHash = await hashPassword("marugoto03");
  const created = await createUser({
    username,
    role: "student",
    passwordHash: initialHash,
    mustChangePassword: true,
  });
  if (!created.ok) throw new Error(created.reason);

  const first = await authenticate(username, "marugoto03");
  assertEquals(first?.mustChangePassword, true);

  const changed = await changePassword(username, "newPassword88");
  assertEquals(changed, true);

  const second = await authenticate(username, "newPassword88");
  assertEquals(second?.mustChangePassword, false);
});
