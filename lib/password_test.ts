import { assertEquals } from "@std/assert";
import { hashPassword, verifyPassword } from "./password.ts";

Deno.test("password: hash and verify", async () => {
  const hash = await hashPassword("secret1234");
  assertEquals(await verifyPassword("secret1234", hash), true);
  assertEquals(await verifyPassword("wrong-pass", hash), false);
});
